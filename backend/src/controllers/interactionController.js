// backend/src/controllers/interactionController.js
const { User, Profile, Photo, sequelize } = require('../models');
const { Op } = require('sequelize');

// Like a user
exports.likeUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if target user exists
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the current user has their own profile picture
        const hasProfilePicture = await Photo.findOne({
            where: {
                user_id: req.user.id,
                is_profile: true
            }
        });

        if (!hasProfilePicture) {
            return res.status(400).json({
                message: 'You must set a profile picture before liking other users'
            });
        }

        // Check if already liked
        const existingLike = await sequelize.query(`
            SELECT * FROM user_likes 
            WHERE liker_id = :likerId AND liked_id = :likedId
        `, {
            replacements: { likerId: req.user.id, likedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existingLike.length > 0) {
            return res.status(400).json({ message: 'You already liked this user' });
        }

        // Create the like
        await sequelize.query(`
            INSERT INTO user_likes (liker_id, liked_id, created_at)
            VALUES (:likerId, :likedId, NOW())
        `, {
            replacements: { likerId: req.user.id, likedId: userId }
        });

        // Increment likes count for the target user
        await Profile.increment('likes_count', {
            by: 1,
            where: { user_id: userId }
        });

        // Check if this creates a match (mutual like)
        const mutualLike = await sequelize.query(`
            SELECT * FROM user_likes 
            WHERE liker_id = :likedId AND liked_id = :likerId
        `, {
            replacements: { likerId: req.user.id, likedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        let isMatch = false;

        if (mutualLike.length > 0) {
            // It's a match! Record it in the matches table
            await sequelize.query(`
                INSERT INTO matches (user1_id, user2_id, created_at)
                VALUES (:user1Id, :user2Id, NOW())
            `, {
                replacements: {
                    user1Id: Math.min(req.user.id, parseInt(userId)),
                    user2Id: Math.max(req.user.id, parseInt(userId))
                }
            });

            // Increment matches count for both users
            await Profile.increment('matches_count', {
                by: 1,
                where: {
                    user_id: {
                        [Op.in]: [req.user.id, parseInt(userId)]
                    }
                }
            });

            isMatch = true;

            // Create match notification for both users
            await createNotification(userId, 'match', req.user.id);
            await createNotification(req.user.id, 'match', userId);
        } else {
            // Just create a like notification
            await createNotification(userId, 'like', req.user.id);
        }

        // Update fame ratings
        await updateFameRating(userId);
        await updateFameRating(req.user.id);

        res.status(200).json({
            message: isMatch ? 'It\'s a match!' : 'User liked successfully',
            isMatch
        });
    } catch (error) {
        console.error('Like user error:', error);
        res.status(500).json({ message: 'Server error liking user' });
    }
};

// Unlike a user
exports.unlikeUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if target user exists
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the like exists
        const existingLike = await sequelize.query(`
            SELECT * FROM user_likes 
            WHERE liker_id = :likerId AND liked_id = :likedId
        `, {
            replacements: { likerId: req.user.id, likedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existingLike.length === 0) {
            return res.status(400).json({ message: 'You haven\'t liked this user' });
        }

        // Delete the like
        await sequelize.query(`
            DELETE FROM user_likes 
            WHERE liker_id = :likerId AND liked_id = :likedId
        `, {
            replacements: { likerId: req.user.id, likedId: userId }
        });

        // Decrement likes count for the target user
        await Profile.decrement('likes_count', {
            by: 1,
            where: { user_id: userId }
        });

        // Check if there was a match and remove it
        const wasMatched = await sequelize.query(`
            SELECT * FROM matches 
            WHERE (user1_id = :user1Id AND user2_id = :user2Id)
               OR (user1_id = :user2Id AND user2_id = :user1Id)
        `, {
            replacements: {
                user1Id: req.user.id,
                user2Id: parseInt(userId)
            },
            type: sequelize.QueryTypes.SELECT
        });

        if (wasMatched.length > 0) {
            // Remove the match
            await sequelize.query(`
                DELETE FROM matches 
                WHERE (user1_id = :user1Id AND user2_id = :user2Id)
                   OR (user1_id = :user2Id AND user2_id = :user1Id)
            `, {
                replacements: {
                    user1Id: req.user.id,
                    user2Id: parseInt(userId)
                }
            });

            // Decrement matches count for both users
            await Profile.decrement('matches_count', {
                by: 1,
                where: {
                    user_id: {
                        [Op.in]: [req.user.id, parseInt(userId)]
                    }
                }
            });

            // Create unlike notification
            await createNotification(userId, 'unmatch', req.user.id);
        }

        // Update fame ratings
        await updateFameRating(userId);
        await updateFameRating(req.user.id);

        res.status(200).json({
            message: 'User unliked successfully',
            wasMatch: wasMatched.length > 0
        });
    } catch (error) {
        console.error('Unlike user error:', error);
        res.status(500).json({ message: 'Server error unliking user' });
    }
};

// Block a user
exports.blockUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if target user exists
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already blocked
        const existingBlock = await sequelize.query(`
            SELECT * FROM blocked_users 
            WHERE blocker_id = :blockerId AND blocked_id = :blockedId
        `, {
            replacements: { blockerId: req.user.id, blockedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existingBlock.length > 0) {
            return res.status(400).json({ message: 'You already blocked this user' });
        }

        // Create the block
        await sequelize.query(`
            INSERT INTO blocked_users (blocker_id, blocked_id, created_at)
            VALUES (:blockerId, :blockedId, NOW())
        `, {
            replacements: { blockerId: req.user.id, blockedId: userId }
        });

        // Remove any likes between the users
        await sequelize.query(`
            DELETE FROM user_likes 
            WHERE (liker_id = :user1Id AND liked_id = :user2Id)
               OR (liker_id = :user2Id AND liked_id = :user1Id)
        `, {
            replacements: {
                user1Id: req.user.id,
                user2Id: parseInt(userId)
            }
        });

        // Remove any matches between the users
        await sequelize.query(`
            DELETE FROM matches 
            WHERE (user1_id = :user1Id AND user2_id = :user2Id)
               OR (user1_id = :user2Id AND user2_id = :user1Id)
        `, {
            replacements: {
                user1Id: req.user.id,
                user2Id: parseInt(userId)
            }
        });

        res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Server error blocking user' });
    }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if the block exists
        const existingBlock = await sequelize.query(`
            SELECT * FROM blocked_users 
            WHERE blocker_id = :blockerId AND blocked_id = :blockedId
        `, {
            replacements: { blockerId: req.user.id, blockedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existingBlock.length === 0) {
            return res.status(400).json({ message: 'This user is not blocked' });
        }

        // Remove the block
        await sequelize.query(`
            DELETE FROM blocked_users 
            WHERE blocker_id = :blockerId AND blocked_id = :blockedId
        `, {
            replacements: { blockerId: req.user.id, blockedId: userId }
        });

        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ message: 'Server error unblocking user' });
    }
};

// Report user as fake
exports.reportUser = async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    try {
        // Check if target user exists
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already reported
        const existingReport = await sequelize.query(`
            SELECT * FROM user_reports 
            WHERE reporter_id = :reporterId AND reported_id = :reportedId
        `, {
            replacements: { reporterId: req.user.id, reportedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existingReport.length > 0) {
            return res.status(400).json({ message: 'You already reported this user' });
        }

        // Create the report
        await sequelize.query(`
            INSERT INTO user_reports (reporter_id, reported_id, reason, created_at)
            VALUES (:reporterId, :reportedId, :reason, NOW())
        `, {
            replacements: {
                reporterId: req.user.id,
                reportedId: userId,
                reason: reason || 'Fake account'
            }
        });

        res.status(200).json({ message: 'User reported successfully' });
    } catch (error) {
        console.error('Report user error:', error);
        res.status(500).json({ message: 'Server error reporting user' });
    }
};

// Get my likes (both given and received)
exports.getMyLikes = async (req, res) => {
    try {
        // Get users I've liked
        const usersILiked = await sequelize.query(`
            SELECT u.user_id, u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                   ul.created_at as liked_at,
                   p.file_path as profile_picture
            FROM user_likes ul
            JOIN users u ON ul.liked_id = u.user_id
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE ul.liker_id = :userId
            ORDER BY ul.created_at DESC
        `, {
            replacements: { userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        // Get users who liked me
        const usersWhoLikedMe = await sequelize.query(`
            SELECT u.user_id, u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                   ul.created_at as liked_at,
                   p.file_path as profile_picture
            FROM user_likes ul
            JOIN users u ON ul.liker_id = u.user_id
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE ul.liked_id = :userId
            ORDER BY ul.created_at DESC
        `, {
            replacements: { userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json({
            given: usersILiked,
            received: usersWhoLikedMe
        });
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ message: 'Server error getting likes' });
    }
};

// Get my matches
exports.getMyMatches = async (req, res) => {
    try {
        // Get all my matches
        const matches = await sequelize.query(`
            SELECT 
                m.match_id,
                m.created_at as matched_at,
                CASE 
                    WHEN m.user1_id = :userId THEN m.user2_id
                    ELSE m.user1_id
                END as other_user_id,
                u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                p.file_path as profile_picture
            FROM matches m
            JOIN users u ON (
                CASE 
                    WHEN m.user1_id = :userId THEN m.user2_id
                    ELSE m.user1_id
                END = u.user_id
            )
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE m.user1_id = :userId OR m.user2_id = :userId
            ORDER BY m.created_at DESC
        `, {
            replacements: { userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(matches);
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ message: 'Server error getting matches' });
    }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
    try {
        const blockedUsers = await sequelize.query(`
            SELECT u.user_id, u.username, u.first_name, u.last_name,
                   b.created_at as blocked_at,
                   p.file_path as profile_picture
            FROM blocked_users b
            JOIN users u ON b.blocked_id = u.user_id
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE b.blocker_id = :userId
            ORDER BY b.created_at DESC
        `, {
            replacements: { userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(blockedUsers);
    } catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({ message: 'Server error getting blocked users' });
    }
};

// Helper function to create a notification
const createNotification = async (userId, type, fromUserId, entityId = null) => {
    try {
        await sequelize.query(`
            INSERT INTO notifications (user_id, type, from_user_id, entity_id, is_read, created_at)
            VALUES (:userId, :type, :fromUserId, :entityId, false, NOW())
        `, {
            replacements: { userId, type, fromUserId, entityId }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Helper function to update fame rating
const updateFameRating = async (userId) => {
    try {
        // Get profile stats
        const profile = await Profile.findOne({
            where: { user_id: userId }
        });

        if (!profile) return;

        // Calculate fame rating based on views, likes, and matches
        // The exact algorithm can be adjusted based on your needs
        const viewsWeight = 0.3;
        const likesWeight = 0.4;
        const matchesWeight = 0.3;

        // Normalize each metric to a 0-100 scale
        // These thresholds can be adjusted
        const normalizedViews = Math.min(100, (profile.views_count / 100) * 100);
        const normalizedLikes = Math.min(100, (profile.likes_count / 50) * 100);
        const normalizedMatches = Math.min(100, (profile.matches_count / 20) * 100);

        // Calculate weighted fame rating
        const fameRating = (
            (normalizedViews * viewsWeight) +
            (normalizedLikes * likesWeight) +
            (normalizedMatches * matchesWeight)
        );

        // Update the profile
        await profile.update({
            fame_rating: Math.round(fameRating)
        });
    } catch (error) {
        console.error('Error updating fame rating:', error);
    }
};