// backend/src/controllers/notificationController.js
const { sequelize } = require('../config/database');

// Get all notifications for the current user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await sequelize.query(`
            SELECT 
                n.notification_id,
                n.type,
                n.is_read,
                n.created_at,
                n.entity_id,
                u.user_id as from_user_id,
                u.username as from_username,
                u.first_name as from_first_name,
                u.last_name as from_last_name,
                p.file_path as from_profile_picture
            FROM notifications n
            LEFT JOIN users u ON n.from_user_id = u.user_id
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE n.user_id = :userId
            ORDER BY n.created_at DESC
            LIMIT 50
        `, {
            replacements: { userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        // Format the notifications for better client-side use
        const formattedNotifications = notifications.map(notification => {
            let message = '';

            switch(notification.type) {
                case 'like':
                    message = `${notification.from_first_name} ${notification.from_last_name} liked your profile`;
                    break;
                case 'profile_view':
                    message = `${notification.from_first_name} ${notification.from_last_name} viewed your profile`;
                    break;
                case 'match':
                    message = `You matched with ${notification.from_first_name} ${notification.from_last_name}!`;
                    break;
                case 'message':
                    message = `${notification.from_first_name} ${notification.from_last_name} sent you a message`;
                    break;
                case 'unmatch':
                    message = `${notification.from_first_name} ${notification.from_last_name} unliked your profile`;
                    break;
                default:
                    message = 'You have a new notification';
            }

            return {
                id: notification.notification_id,
                type: notification.type,
                message,
                isRead: notification.is_read,
                createdAt: notification.created_at,
                fromUser: {
                    id: notification.from_user_id,
                    username: notification.from_username,
                    firstName: notification.from_first_name,
                    lastName: notification.from_last_name,
                    profilePicture: notification.from_profile_picture
                },
                entityId: notification.entity_id
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

// Mark notification as read
exports.markAsRead = async (req, res) => {
    const { notificationId } = req.params;

    try {
        await sequelize.query(`
            UPDATE notifications
            SET is_read = true
            WHERE notification_id = :notificationId AND user_id = :userId
        `, {
            replacements: { notificationId, userId: req.user.id }
        });

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await sequelize.query(`
            UPDATE notifications
            SET is_read = true
            WHERE user_id = :userId AND is_read = false
        `, {
            replacements: { userId: req.user.id }
        });

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Server error marking all notifications as read' });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    const { notificationId } = req.params;

    try {
        await sequelize.query(`
            DELETE FROM notifications
            WHERE notification_id = :notificationId AND user_id = :userId
        `, {
            replacements: { notificationId, userId: req.user.id }
        });

        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
    try {
        await sequelize.query(`
            DELETE FROM notifications
            WHERE user_id = :userId
        `, {
            replacements: { userId: req.user.id }
        });

        res.status(200).json({ message: 'All notifications deleted' });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ message: 'Server error deleting all notifications' });
    }
};