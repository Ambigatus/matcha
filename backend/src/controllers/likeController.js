// // backend/src/controllers/likeController.js
// const { sequelize } = require('../config/database');
// const { User, Profile, Photo, Like, Match } = require('../models');
// const { Op } = require('sequelize');
// const { catchAsync, AppError } = require('../middleware/errorHandler');
//
// /**
//  * Like a user
//  */
// exports.likeUser = catchAsync(async (req, res, next) => {
//     const { targetId } = req.params;
//     const userId = req.user.id;
//
//     // Validate users
//     if (targetId == userId) {
//         return next(new AppError('You cannot like yourself', 400));
//     }
//
//     // Check if target user exists
//     const targetUser = await User.findByPk(targetId);
//     if (!targetUser) {
//         return next(new AppError('User not found', 404));
//     }
//
//     // Check if current user has a profile picture
//     const userPhotos = await Photo.findOne({
//         where: {
//             user_id: userId,
//             is_profile: true
//         }
//     });
//
//     if (!userPhotos) {
//         return next(new AppError('You need a profile picture to like other users', 400));
//     }
//
//     // Check if already liked
//     const existingLike = await Like.findOne({
//         where: {
//             liker_id: userId,
//             liked_id: targetId
//         }
//     });
//
//     if (existingLike) {
//         return next(new AppError('You already liked this user', 400));
//     }
//
//     // Using transaction to ensure data consistency
//     const result = await sequelize.transaction(async (t) => {
//         // Create the like
//         const like = await Like.create({
//             liker_id: userId,
//             liked_id: targetId
//         }, { transaction: t });
//
//         // Increment the like count for the target user
//         await Profile.increment('likes_count', {
//             where: { user_id: targetId },
//             transaction: t
//         });
//
//         // Check if the target user also likes current user
//         const mutualLike = await Like.findOne({
//             where: {
//                 liker_id: targetId,
//                 liked_id: userId
//             },
//             transaction: t
//         });
//
//         // If mutual like, create a match
//         if (mutualLike) {
//             const match = await Match.create({
//                 user1_id: userId < targetId ? userId : targetId,
//                 user2_id: userId < targetId ? targetId : userId
//             }, { transaction: t });
//
//             // Increment match count for both users
//             await Profile.increment('matches_count', {
//                 where: { user_id: userId },
//                 transaction: t
//             });
//
//             await Profile.increment('matches_count', {
//                 where: { user_id: targetId },
//                 transaction: t
//             });
//
//             // Create match notifications
//             await createNotification(targetId, 'match', userId, null, t);
//             await createNotification(userId, 'match', targetId, null, t);
//
//             return {
//                 like,
//                 isMatch: true,
//                 matchId: match.match_id
//             };
//         } else {
//             // Just a like, create like notification
//             await createNotification(targetId, 'like', userId, null, t);
//
//             return {
//                 like,
//                 isMatch: false
//             };
//         }
//     });
//
//     // Update fame ratings for both users
//     await updateFameRating(targetId);
//     await updateFameRating(userId);
//
//     if (result.isMatch) {
//         res.status(201).json({
//             message: 'User liked successfully! You matched!',
//             isMatch: true,
//             matchId: result.matchId
//         });
//     } else {
//         res.status(201).json({
//             message: 'User liked successfully',
//             isMatch: false
//         });
//     }
// });
//
// /**
//  * Unlike a user
//  */
// exports.unlikeUser = catchAsync(async (req, res, next) => {
//     const { targetId } = req.params;
//     const userId = req.user.id;
//
//     // Using transaction for data consistency
//     const result = await sequelize.transaction(async (t) => {
//         // Find the like
//         const like = await Like.findOne({
//             where: {
//                 liker_id: userId,
//                 liked_id: targetId
//             },
//             transaction: t
//         });
//
//         if (!like) {
//             return next(new AppError('Like not found', 404));
//         }
//
//         // Delete the like
//         await like.destroy({ transaction: t });
//
//         // Decrement the like count
//         await Profile.decrement('likes_count', {
//             where: { user_id: targetId },
//             transaction: t
//         });
//
//         // Check if there was a match
//         const match = await Match.findOne({
//             where: {
//                 [Op.or]: [
//                     { user1_id: userId, user2_id: targetId },
//                     { user1_id: targetId, user2_id: userId }
//                 ]
//             },
//             transaction: t
//         });
//
//         // If there was a match, delete it and update counts
//         if (match) {
//             const matchId = match.match_id;
//             await match.destroy({ transaction: t });
//
//             // Decrement match count for both users
//             await Profile.decrement('matches_count', {
//                 where: { user_id: userId },
//                 transaction: t
//             });
//
//             await Profile.decrement('matches_count', {
//                 where: { user_id: targetId },
//                 transaction: t
//             });
//
//             // Delete any messages from this match
//             await sequelize.query(`
//                 DELETE FROM messages
//                 WHERE match_id = :matchId
//             `, {
//                 replacements: { matchId },
//                 transaction: t
//             });
//
//             // Create unmatch notification
//             await createNotification(targetId, 'unmatch', userId, null, t);
//
//             return { wasMatch: true, matchId };
//         }
//
//         return { wasMatch: false };
//     });
//
//     // Update fame ratings
//     await updateFameRating(targetId);
//     await updateFameRating(userId);
//
//     res.status(200).json({
//         message: 'User unliked successfully',
//         wasMatch: result.wasMatch
//     });
// });
//
// /**
//  * Get users who liked the current user
//  */
// exports.getLikedBy = catchAsync(async (req, res) => {
//     const userId = req.user.id;
//
//     // Get users who liked the current user
//     const likes = await Like.findAll({
//         where: { liked_id: userId },
//         include: [
//             {
//                 model: User,
//                 as: 'liker',
//                 attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
//                 include: [
//                     {
//                         model: Profile,
//                         as: 'profile',
//                         attributes: ['gender', 'bio', 'birth_date', 'last_location', 'fame_rating']
//                     },
//                     {
//                         model: Photo,
//                         as: 'photos',
//                         where: { is_profile: true },
//                         required: false,
//                         attributes: ['photo_id', 'file_path']
//                     }
//                 ]
//             }
//         ]
//     });
//
//     // Format the response
//     const likedByProfiles = likes.map(like => ({
//         userId: like.liker.user_id,
//         username: like.liker.username,
//         firstName: like.liker.first_name,
//         lastName: like.liker.last_name,
//         gender: like.liker.profile?.gender,
//         bio: like.liker.profile?.bio,
//         birthDate: like.liker.profile?.birth_date,
//         location: like.liker.profile?.last_location,
//         fameRating: like.liker.profile?.fame_rating,
//         isOnline: like.liker.is_online,
//         lastLogin: like.liker.last_login,
//         profilePicture: like.liker.photos.length > 0 ? like.liker.photos[0].file_path : null,
//         likedAt: like.created_at
//     }));
//
//     res.status(200).json(likedByProfiles);
// });
//
// /**
//  * Get users the current user has liked
//  */
// exports.getLiked = catchAsync(async (req, res) => {
//     const userId = req.user.id;
//
//     // Get users the current user has liked
//     const likes = await Like.findAll({
//         where: { liker_id: userId },
//         include: [
//             {
//                 model: User,
//                 as: 'liked',
//                 attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
//                 include: [
//                     {
//                         model: Profile,
//                         as: 'profile',
//                         attributes: ['gender', 'bio', 'birth_date', 'last_location', 'fame_rating']
//                     },
//                     {
//                         model: Photo,
//                         as: 'photos',
//                         where: { is_profile: true },
//                         required: false,
//                         attributes: ['photo_id', 'file_path']
//                     }
//                 ]
//             }
//         ]
//     });
//
//     // Format the response
//     const likedProfiles = likes.map(like => ({
//         userId: like.liked.user_id,
//         username: like.liked.username,
//         firstName: like.liked.first_name,
//         lastName: like.liked.last_name,
//         gender: like.liked.profile?.gender,
//         bio: like.liked.profile?.bio,
//         birthDate: like.liked.profile?.birth_date,
//         location: like.liked.profile?.last_location,
//         fameRating: like.liked.profile?.fame_rating,
//         isOnline: like.liked.is_online,
//         lastLogin: like.liked.last_login,
//         profilePicture: like.liked.photos.length > 0 ? like.liked.photos[0].file_path : null,
//         likedAt: like.created_at
//     }));
//
//     res.status(200).json(likedProfiles);
// });
//
// /**
//  * Get matches for current user
//  */
// exports.getMatches = catchAsync(async (req, res) => {
//     const userId = req.user.id;
//
//     // Get all matches for the user
//     const matches = await sequelize.query(`
//         SELECT
//             m.match_id,
//             m.created_at as matched_at,
//             CASE
//                 WHEN m.user1_id = :userId THEN m.user2_id
//                 ELSE m.user1_id
//             END as other_user_id,
//             u.username, u.first_name, u.last_name, u.is_online, u.last_login,
//             p.gender, p.birth_date, p.last_location, p.fame_rating,
//             ph.file_path as profile_picture,
//             (
//                 SELECT COUNT(*)
//                 FROM messages
//                 WHERE match_id = m.match_id
//                 AND receiver_id = :userId
//                 AND is_read = false
//             ) as unread_count,
//             (
//                 SELECT created_at
//                 FROM messages
//                 WHERE match_id = m.match_id
//                 ORDER BY created_at DESC
//                 LIMIT 1
//             ) as last_message_time
//         FROM matches m
//         JOIN users u ON (
//             CASE
//                 WHEN m.user1_id = :userId THEN m.user2_id
//                 ELSE m.user1_id
//             END = u.user_id
//         )
//         LEFT JOIN profiles p ON u.user_id = p.user_id
//         LEFT JOIN photos ph ON u.user_id = ph.user_id AND ph.is_profile = true
//         WHERE m.user1_id = :userId OR m.user2_id = :userId
//         ORDER BY
//             COALESCE(last_message_time, m.created_at) DESC
//     `, {
//         replacements: { userId },
//         type: sequelize.QueryTypes.SELECT
//     });
//
//     // Format matches with calculated age
//     const formattedMatches = matches.map(match => {
//         // Calculate age
//         let age = null;
//         if (match.birth_date) {
//             const today = new Date();
//             const birthDate = new Date(match.birth_date);
//             age = today.getFullYear() - birthDate.getFullYear();
//             const monthDiff = today.getMonth() - birthDate.getMonth();
//             if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//                 age--;
//             }
//         }
//
//         return {
//             matchId: match.match_id,
//             userId: match.other_user_id,
//             username: match.username,
//             firstName: match.first_name,
//             lastName: match.last_name,
//             age,
//             gender: match.gender,
//             location: match.last_location,
//             fameRating: match.fame_rating,
//             isOnline: match.is_online,
//             lastLogin: match.last_login,
//             profilePicture: match.profile_picture,
//             matchedAt: match.matched_at,
//             unreadCount: parseInt(match.unread_count) || 0,
//             lastMessageTime: match.last_message_time
//         };
//     });
//
//     res.status(200).json(formattedMatches);
// });
//
// /**
//  * Check if two users are matched
//  */
// exports.checkMatch = catchAsync(async (req, res) => {
//     const userId = req.user.id;
//     const { targetId } = req.params;
//
//     // Check if there's a match between the users
//     const match = await Match.findOne({
//         where: {
//             [Op.or]: [
//                 { user1_id: userId, user2_id: targetId },
//                 { user1_id: targetId, user2_id: userId }
//             ]
//         }
//     });
//
//     res.status(200).json({
//         isMatch: !!match,
//         matchId: match ? match.match_id : null
//     });
// });
//
// /**
//  * Helper function to create a notification
//  * @param {number} userId - User ID to receive notification
//  * @param {string} type - Notification type
//  * @param {number} fromUserId - User ID who triggered notification
//  * @param {number|null} entityId - Related entity ID
//  * @param {Transaction} transaction - Sequelize transaction
//  */
// const createNotification = async (userId, type, fromUserId, entityId = null, transaction = null) => {
//     try {
//         await sequelize.query(`
//             INSERT INTO notifications (user_id, type, from_user_id, entity_id, is_read, created_at)
//             VALUES (:userId, :type, :fromUserId, :entityId, false, NOW())
//         `, {
//             replacements: { userId, type, fromUserId, entityId },
//             transaction
//         });
//     } catch (error) {
//         console.error('Error creating notification:', error);
//     }
// };
//
// /**
//  * Helper function to update fame rating
//  * @param {number} userId - User ID to update fame rating
//  */
// const updateFameRating = async (userId) => {
//     try {
//         // Get profile stats
//         const profile = await Profile.findOne({
//             where: { user_id: userId }
//         });
//
//         if (!profile) return;
//
//         // Calculate fame rating based on views, likes, and matches
//         const viewsWeight = 0.3;
//         const likesWeight = 0.4;
//         const matchesWeight = 0.3;
//
//         // Normalize each metric to a 0-100 scale
//         const normalizedViews = Math.min(100, (profile.views_count / 100) * 100);
//         const normalizedLikes = Math.min(100, (profile.likes_count / 50) * 100);
//         const normalizedMatches = Math.min(100, (profile.matches_count / 20) * 100);
//
//         // Calculate weighted fame rating
//         const fameRating = (
//             (normalizedViews * viewsWeight) +
//             (normalizedLikes * likesWeight) +
//             (normalizedMatches * matchesWeight)
//         );
//
//         // Update the profile
//         await profile.update({
//             fame_rating: Math.round(fameRating)
//         });
//     } catch (error) {
//         console.error('Error updating fame rating:', error);
//     }
// };