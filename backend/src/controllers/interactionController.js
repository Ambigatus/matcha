// backend/src/controllers/interactionController.js
const { User, Profile, Photo, Like, Match, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Like a user
 */
exports.likeUser = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    try {
        // Validate users
        if (userId == currentUserId) {
            return res.status(400).json({ message: 'You cannot like yourself' });
        }

        // Check if target user exists
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the current user has a profile picture
        const hasProfilePicture = await Photo.findOne({
            where: {
                user_id: currentUserId,
                is_profile: true
            }
        });

        if (!hasProfilePicture) {
            return res.status(400).json({
                message: 'You must set a profile picture before liking other users'
            });
        }

        // Using transaction to ensure data consistency
        const result = await sequelize.transaction(async (t) => {
            // Check if already liked
            const existingLike = await Like.findOne({
                where: {
                    liker_id: currentUserId,
                    liked_id: userId
                },
                transaction: t
            });

            if (existingLike) {
                return { alreadyLiked: true };
            }

            // Create the like
            await Like.create({
                liker_id: currentUserId,
                liked_id: userId
            }, { transaction: t });

            // Increment likes count for the target user
            await Profile.increment('likes_count', {
                by: 1,
                where: { user_id: userId },
                transaction: t
            });

            // Check if this creates a match (mutual like)
            const mutualLike = await Like.findOne({
                where: {
                    liker_id: userId,
                    liked_id: currentUserId
                },
                transaction: t
            });

            let isMatch = false;
            let matchId = null;

            if (mutualLike) {
                // It's a match! Record it in the matches table
                const match = await Match.create({
                    user1_id: Math.min(currentUserId, parseInt(userId)),
                    user2_id: Math.max(currentUserId, parseInt(userId))
                }, { transaction: t });

                // Increment matches count for both users
                await Profile.increment('matches_count', {
                    by: 1,
                    where: {
                        user_id: {
                            [Op.in]: [currentUserId, parseInt(userId)]
                        }
                    },
                    transaction: t
                });

                isMatch = true;
                matchId = match.match_id;

                // Create match notification for both users
                await createNotification(userId, 'match', currentUserId, null, t);
                await createNotification(currentUserId, 'match', userId, null, t);
            } else {
                // Just create a like notification
                await createNotification(userId, 'like', currentUserId, null, t);
            }

            return { isMatch, matchId };
        });

        // Update fame ratings
        await updateFameRating(userId);
        await updateFameRating(currentUserId);

        if (result.alreadyLiked) {
            return res.status(400).json({ message: 'You already liked this user' });
        }

        if (result.isMatch) {
            res.status(200).json({
                message: 'It\'s a match!',
                isMatch: true,
                matchId: result.matchId
            });
        } else {
            res.status(200).json({
                message: 'User liked successfully',
                isMatch: false
            });
        }
    } catch (error) {
        console.error('Like user error:', error);
        res.status(500).json({ message: 'Server error liking user' });
    }
};

/**
 * Unlike a user
 */
exports.unlikeUser = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    try {
        // Using transaction for data consistency
        const result = await sequelize.transaction(async (t) => {
            // Find the like
            const like = await Like.findOne({
                where: {
                    liker_id: currentUserId,
                    liked_id: userId
                },
                transaction: t
            });

            if (!like) {
                return { notLiked: true };
            }

            // Delete the like
            await like.destroy({ transaction: t });

            // Decrement the like count
            await Profile.decrement('likes_count', {
                where: { user_id: userId },
                transaction: t
            });

            // Check if there was a match
            const match = await Match.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: currentUserId, user2_id: userId },
                        { user1_id: userId, user2_id: currentUserId }
                    ]
                },
                transaction: t
            });

            // If there was a match, delete it and update counts
            if (match) {
                const matchId = match.match_id;
                await match.destroy({ transaction: t });

                // Decrement match count for both users
                await Profile.decrement('matches_count', {
                    where: { user_id: { [Op.in]: [currentUserId, parseInt(userId)] } },
                    transaction: t
                });

                // Delete any messages from this match
                await sequelize.query(`
                    DELETE FROM messages
                    WHERE match_id = :matchId
                `, {
                    replacements: { matchId },
                    transaction: t
                });

                // Create unmatch notification
                await createNotification(userId, 'unmatch', currentUserId, null, t);

                return { wasMatch: true, matchId };
            }

            return { wasMatch: false };
        });

        // Update fame ratings
        await updateFameRating(userId);
        await updateFameRating(currentUserId);

        if (result.notLiked) {
            return res.status(400).json({ message: 'You haven\'t liked this user' });
        }

        res.status(200).json({
            message: 'User unliked successfully',
            wasMatch: result.wasMatch
        });
    } catch (error) {
        console.error('Unlike user error:', error);
        res.status(500).json({ message: 'Server error unliking user' });
    }
};

/**
 * Block a user
 */
exports.blockUser = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

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
            replacements: { blockerId: currentUserId, blockedId: userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existingBlock.length > 0) {
            return res.status(400).json({ message: 'You already blocked this user' });
        }

        // Using transaction for data consistency
        await sequelize.transaction(async (t) => {
            // Create the block
            await sequelize.query(`
                INSERT INTO blocked_users (blocker_id, blocked_id, blocked_at)
                VALUES (:blockerId, :blockedId, NOW())
            `, {
                replacements: { blockerId: currentUserId, blockedId: userId },
                transaction: t
            });

            // Remove any likes between the users
            await Like.destroy({
                where: {
                    [Op.or]: [
                        { liker_id: currentUserId, liked_id: userId },
                        { liker_id: userId, liked_id: currentUserId }
                    ]
                },
                transaction: t
            });

            // Remove any matches between the users
            const match = await Match.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: currentUserId, user2_id: userId },
                        { user1_id: userId, user2_id: currentUserId }
                    ]
                },
                transaction: t
            });

            if (match) {
                const matchId = match.match_id;
                await match.destroy({ transaction: t });

                // Delete any messages from this match
                await sequelize.query(`
                    DELETE FROM messages
                    WHERE match_id = :matchId
                `, {
                    replacements: { matchId },
                    transaction: t
                });
            }
        });

        // Update fame ratings
        await updateFameRating(userId);
        await updateFameRating(currentUserId);

        res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Server error blocking user' });
    }
};

/**
 * Unblock a user
 */
exports.unblockUser = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    try {
        // Check if the block exists
        const existingBlock = await sequelize.query(`
            SELECT * FROM blocked_users 
            WHERE blocker_id = :blockerId AND blocked_id = :blockedId
        `, {
            replacements: { blockerId: currentUserId, blockedId: userId },
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
            replacements: { blockerId: currentUserId, blockedId: userId }
        });

        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ message: 'Server error unblocking user' });
    }
};

/**
 * Report user as fake
 */
exports.reportUser = async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const currentUserId = req.user.id;

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
            replacements: { reporterId: currentUserId, reportedId: userId },
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
                reporterId: currentUserId,
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

/**
 * Get users who liked the current user
 */
exports.getLikedByUsers = async (req, res) => {
    const currentUserId = req.user.id;

    try {
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
            replacements: { userId: currentUserId },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(usersWhoLikedMe);
    } catch (error) {
        console.error('Get liked by users error:', error);
        res.status(500).json({ message: 'Server error getting users who liked you' });
    }
};

/**
 * Get users the current user has liked
 */
exports.getLikedUsers = async (req, res) => {
    const currentUserId = req.user.id;

    try {
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
            replacements: { userId: currentUserId },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(usersILiked);
    } catch (error) {
        console.error('Get liked users error:', error);
        res.status(500).json({ message: 'Server error getting users you liked' });
    }
};

/**
 * Get all user likes (both given and received)
 */
exports.getAllLikes = async (req, res) => {
    const currentUserId = req.user.id;

    try {
        const [usersILiked, usersWhoLikedMe] = await Promise.all([
            sequelize.query(`
                SELECT u.user_id, u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                       ul.created_at as liked_at,
                       p.file_path as profile_picture
                FROM user_likes ul
                JOIN users u ON ul.liked_id = u.user_id
                LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
                WHERE ul.liker_id = :userId
                ORDER BY ul.created_at DESC
            `, {
                replacements: { userId: currentUserId },
                type: sequelize.QueryTypes.SELECT
            }),
            sequelize.query(`
                SELECT u.user_id, u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                       ul.created_at as liked_at,
                       p.file_path as profile_picture
                FROM user_likes ul
                JOIN users u ON ul.liker_id = u.user_id
                LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
                WHERE ul.liked_id = :userId
                ORDER BY ul.created_at DESC
            `, {
                replacements: { userId: currentUserId },
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        res.status(200).json({
            given: usersILiked,
            received: usersWhoLikedMe
        });
    } catch (error) {
        console.error('Get all likes error:', error);
        res.status(500).json({ message: 'Server error getting likes' });
    }
};

/**
 * Get all matches for the current user
 */
exports.getMatches = async (req, res) => {
    const currentUserId = req.user.id;

    try {
        // Get all matches with essential user info
        const matches = await sequelize.query(`
            SELECT 
                m.match_id,
                m.created_at as matched_at,
                CASE 
                    WHEN m.user1_id = :userId THEN m.user2_id
                    ELSE m.user1_id
                END as other_user_id,
                u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                p.profile_id, p.gender, p.birth_date, p.last_location, p.fame_rating,
                ph.file_path as profile_picture,
                (
                    SELECT COUNT(*) 
                    FROM messages 
                    WHERE match_id = m.match_id 
                    AND receiver_id = :userId 
                    AND is_read = false
                ) as unread_count,
                (
                    SELECT created_at
                    FROM messages
                    WHERE match_id = m.match_id
                    ORDER BY created_at DESC
                    LIMIT 1
                ) as last_message_time
            FROM matches m
            JOIN users u ON (
                CASE 
                    WHEN m.user1_id = :userId THEN m.user2_id
                    ELSE m.user1_id
                END = u.user_id
            )
            LEFT JOIN profiles p ON u.user_id = p.user_id
            LEFT JOIN photos ph ON u.user_id = ph.user_id AND ph.is_profile = true
            WHERE m.user1_id = :userId OR m.user2_id = :userId
            ORDER BY 
                COALESCE(last_message_time, m.created_at) DESC
        `, {
            replacements: { userId: currentUserId },
            type: sequelize.QueryTypes.SELECT
        });

        // Format matches with calculated age
        const formattedMatches = matches.map(match => {
            // Calculate age
            let age = null;
            if (match.birth_date) {
                const today = new Date();
                const birthDate = new Date(match.birth_date);
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            return {
                matchId: match.match_id,
                userId: match.other_user_id,
                username: match.username,
                firstName: match.first_name,
                lastName: match.last_name,
                age,
                gender: match.gender,
                location: match.last_location,
                fameRating: match.fame_rating,
                isOnline: match.is_online,
                lastLogin: match.last_login,
                profilePicture: match.profile_picture,
                matchedAt: match.matched_at,
                unreadCount: parseInt(match.unread_count) || 0,
                lastMessageTime: match.last_message_time
            };
        });

        res.status(200).json(formattedMatches);
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ message: 'Server error getting matches' });
    }
};

/**
 * Get blocked users
 */
exports.getBlockedUsers = async (req, res) => {
    const currentUserId = req.user.id;

    try {
        const blockedUsers = await sequelize.query(`
            SELECT u.user_id, u.username, u.first_name, u.last_name,
                   b.blocked_at as blocked_at,
                   p.file_path as profile_picture
            FROM blocked_users b
            JOIN users u ON b.blocked_id = u.user_id
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE b.blocker_id = :userId
            ORDER BY b.blocked_at DESC
        `, {
            replacements: { userId: currentUserId },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(blockedUsers);
    } catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({ message: 'Server error getting blocked users' });
    }
};

/**
 * Check if two users are matched
 */
exports.checkMatch = async (req, res) => {
    const currentUserId = req.user.id;
    const { targetId } = req.params;

    try {
        // Check if there's a match between the users
        const match = await Match.findOne({
            where: {
                [Op.or]: [
                    { user1_id: currentUserId, user2_id: targetId },
                    { user1_id: targetId, user2_id: currentUserId }
                ]
            }
        });

        res.status(200).json({
            isMatch: !!match,
            matchId: match ? match.match_id : null
        });
    } catch (error) {
        console.error('Check match error:', error);
        res.status(500).json({ message: 'Server error checking match status' });
    }
};

/**
 * Helper function to create a notification
 * @param {number} userId - User ID to receive notification
 * @param {string} type - Notification type
 * @param {number} fromUserId - User ID who triggered notification
 * @param {number|null} entityId - Related entity ID
 * @param {Transaction} transaction - Sequelize transaction
 */
const createNotification = async (userId, type, fromUserId, entityId = null, transaction = null) => {
    try {
        await sequelize.query(`
            INSERT INTO notifications (user_id, type, from_user_id, entity_id, is_read, created_at)
            VALUES (:userId, :type, :fromUserId, :entityId, false, NOW())
        `, {
            replacements: { userId, type, fromUserId, entityId },
            transaction
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

/**
 * Helper function to update fame rating
 * @param {number} userId - User ID to update fame rating
 */
const updateFameRating = async (userId) => {
    try {
        // Get profile stats
        const profile = await Profile.findOne({
            where: { user_id: userId }
        });

        if (!profile) return;

        // Calculate fame rating based on views, likes, and matches
        const viewsWeight = 0.3;
        const likesWeight = 0.4;
        const matchesWeight = 0.3;

        // Normalize each metric to a 0-100 scale
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