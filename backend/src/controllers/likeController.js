// backend/src/controllers/likeController.js
const { sequelize } = require('../config/database');
const { User, Profile, Photo, Like, Match } = require('../models');
const { Op } = require('sequelize');

/**
 * Like a user
 */
exports.likeUser = async (req, res) => {
    try {
        const { targetId } = req.params;
        const userId = req.user.id;

        // Validate users
        if (targetId == userId) {
            return res.status(400).json({ message: 'You cannot like yourself' });
        }

        // Check if target user exists
        const targetUser = await User.findByPk(targetId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if current user has a profile picture
        const userPhotos = await Photo.findOne({
            where: {
                user_id: userId,
                is_profile: true
            }
        });

        if (!userPhotos) {
            return res.status(400).json({
                message: 'You need a profile picture to like other users'
            });
        }

        // Check if already liked
        const existingLike = await Like.findOne({
            where: {
                liker_id: userId,
                liked_id: targetId
            }
        });

        if (existingLike) {
            return res.status(400).json({ message: 'You already liked this user' });
        }

        // Using transaction to ensure data consistency
        const result = await sequelize.transaction(async (t) => {
            // Create the like
            const like = await Like.create({
                liker_id: userId,
                liked_id: targetId
            }, { transaction: t });

            // Increment the like count for the target user
            await Profile.increment('likes_count', {
                where: { user_id: targetId },
                transaction: t
            });

            // Check if the target user also likes current user
            const mutualLike = await Like.findOne({
                where: {
                    liker_id: targetId,
                    liked_id: userId
                },
                transaction: t
            });

            // If mutual like, create a match
            if (mutualLike) {
                const match = await Match.create({
                    user1_id: userId < targetId ? userId : targetId,
                    user2_id: userId < targetId ? targetId : userId
                }, { transaction: t });

                // Increment match count for both users
                await Profile.increment('matches_count', {
                    where: { user_id: userId },
                    transaction: t
                });

                await Profile.increment('matches_count', {
                    where: { user_id: targetId },
                    transaction: t
                });

                return {
                    like,
                    isMatch: true,
                    matchId: match.match_id
                };
            }

            return {
                like,
                isMatch: false
            };
        });

        // Create notification (to be implemented)
        // Call notificationService.createNotification()

        if (result.isMatch) {
            res.status(201).json({
                message: 'User liked successfully! You matched!',
                isMatch: true,
                matchId: result.matchId
            });
        } else {
            res.status(201).json({
                message: 'User liked successfully',
                isMatch: false
            });
        }

    } catch (error) {
        console.error('Like user error:', error);
        res.status(500).json({ message: 'Server error while liking user' });
    }
};

/**
 * Unlike a user
 */
exports.unlikeUser = async (req, res) => {
    try {
        const { targetId } = req.params;
        const userId = req.user.id;

        // Using transaction for data consistency
        await sequelize.transaction(async (t) => {
            // Find the like
            const like = await Like.findOne({
                where: {
                    liker_id: userId,
                    liked_id: targetId
                },
                transaction: t
            });

            if (!like) {
                return res.status(404).json({ message: 'Like not found' });
            }

            // Delete the like
            await like.destroy({ transaction: t });

            // Decrement the like count
            await Profile.decrement('likes_count', {
                where: { user_id: targetId },
                transaction: t
            });

            // Check if there was a match
            const match = await Match.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: userId, user2_id: targetId },
                        { user1_id: targetId, user2_id: userId }
                    ]
                },
                transaction: t
            });

            // If there was a match, delete it and update counts
            if (match) {
                await match.destroy({ transaction: t });

                // Decrement match count for both users
                await Profile.decrement('matches_count', {
                    where: { user_id: userId },
                    transaction: t
                });

                await Profile.decrement('matches_count', {
                    where: { user_id: targetId },
                    transaction: t
                });
            }
        });

        // Create notification (to be implemented)
        // Call notificationService.createNotification()

        res.status(200).json({ message: 'User unliked successfully' });

    } catch (error) {
        console.error('Unlike user error:', error);
        res.status(500).json({ message: 'Server error while unliking user' });
    }
};

/**
 * Get users who liked the current user
 */
exports.getLikedBy = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get users who liked the current user
        const likes = await Like.findAll({
            where: { liked_id: userId },
            include: [
                {
                    model: User,
                    as: 'liker',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['gender', 'bio', 'birth_date', 'last_location', 'fame_rating']
                        },
                        {
                            model: Photo,
                            as: 'photos',
                            where: { is_profile: true },
                            required: false,
                            attributes: ['photo_id', 'file_path']
                        }
                    ]
                }
            ]
        });

        // Format the response
        const likedByProfiles = likes.map(like => ({
            userId: like.liker.user_id,
            username: like.liker.username,
            firstName: like.liker.first_name,
            lastName: like.liker.last_name,
            gender: like.liker.profile?.gender,
            bio: like.liker.profile?.bio,
            birthDate: like.liker.profile?.birth_date,
            location: like.liker.profile?.last_location,
            fameRating: like.liker.profile?.fame_rating,
            isOnline: like.liker.is_online,
            lastLogin: like.liker.last_login,
            profilePicture: like.liker.photos.length > 0 ? like.liker.photos[0].file_path : null,
            likedAt: like.created_at
        }));

        res.status(200).json(likedByProfiles);

    } catch (error) {
        console.error('Get liked by error:', error);
        res.status(500).json({ message: 'Server error retrieving likes' });
    }
};

/**
 * Get users the current user has liked
 */
exports.getLiked = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get users the current user has liked
        const likes = await Like.findAll({
            where: { liker_id: userId },
            include: [
                {
                    model: User,
                    as: 'liked',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['gender', 'bio', 'birth_date', 'last_location', 'fame_rating']
                        },
                        {
                            model: Photo,
                            as: 'photos',
                            where: { is_profile: true },
                            required: false,
                            attributes: ['photo_id', 'file_path']
                        }
                    ]
                }
            ]
        });

        // Format the response
        const likedProfiles = likes.map(like => ({
            userId: like.liked.user_id,
            username: like.liked.username,
            firstName: like.liked.first_name,
            lastName: like.liked.last_name,
            gender: like.liked.profile?.gender,
            bio: like.liked.profile?.bio,
            birthDate: like.liked.profile?.birth_date,
            location: like.liked.profile?.last_location,
            fameRating: like.liked.profile?.fame_rating