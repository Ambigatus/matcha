// backend/src/controllers/notificationController.js
const { User, Notification, Photo, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all notifications for the current user
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Using Sequelize ORM instead of raw SQL
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    as: 'fromUser',
                    attributes: ['user_id', 'username', 'first_name', 'last_name'],
                    include: [
                        {
                            model: Photo,
                            as: 'photos',
                            where: { is_profile: true },
                            attributes: ['file_path'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        // Format the notifications for better client-side use
        const formattedNotifications = notifications.map(notification => {
            const { id, type, is_read, created_at, entity_id, fromUser } = notification;
            let message = '';

            // Generate message based on notification type
            switch(type) {
                case 'like':
                    message = `${fromUser.first_name} ${fromUser.last_name} liked your profile`;
                    break;
                case 'profile_view':
                    message = `${fromUser.first_name} ${fromUser.last_name} viewed your profile`;
                    break;
                case 'match':
                    message = `You matched with ${fromUser.first_name} ${fromUser.last_name}!`;
                    break;
                case 'message':
                    message = `${fromUser.first_name} ${fromUser.last_name} sent you a message`;
                    break;
                case 'unmatch':
                    message = `${fromUser.first_name} ${fromUser.last_name} unliked your profile`;
                    break;
                default:
                    message = 'You have a new notification';
            }

            // Create formatted notification object
            return {
                id: notification.notification_id,
                type,
                message,
                isRead: is_read,
                createdAt: created_at,
                fromUser: {
                    id: fromUser.user_id,
                    username: fromUser.username,
                    firstName: fromUser.first_name,
                    lastName: fromUser.last_name,
                    profilePicture: fromUser.photos && fromUser.photos.length > 0
                        ? fromUser.photos[0].file_path
                        : null
                },
                entityId: entity_id
            };
        });

        // Get count of unread notifications
        const unreadCount = formattedNotifications.filter(n => !n.isRead).length;

        res.status(200).json({
            notifications: formattedNotifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error getting notifications' });
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    try {
        // Find and update notification using Sequelize ORM
        const notification = await Notification.findOne({
            where: {
                notification_id: notificationId,
                user_id: userId
            }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.is_read = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.id;

    try {
        // Update all user's unread notifications
        await Notification.update(
            { is_read: true },
            {
                where: {
                    user_id: userId,
                    is_read: false
                }
            }
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Server error marking all notifications as read' });
    }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    try {
        // Find and delete notification
        const notification = await Notification.findOne({
            where: {
                notification_id: notificationId,
                user_id: userId
            }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.destroy();

        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};

/**
 * Delete all notifications
 */
exports.deleteAllNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        // Delete all user's notifications
        await Notification.destroy({
            where: {
                user_id: userId
            }
        });

        res.status(200).json({ message: 'All notifications deleted' });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ message: 'Server error deleting all notifications' });
    }
};