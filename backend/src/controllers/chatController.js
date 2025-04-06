// backend/src/controllers/chatController.js
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        // Get all matches
        const matches = await sequelize.query(`
            SELECT 
                m.match_id,
                CASE 
                    WHEN m.user1_id = :userId THEN m.user2_id
                    ELSE m.user1_id
                END as other_user_id,
                u.username, u.first_name, u.last_name, u.is_online, u.last_login,
                p.file_path as profile_picture,
                (
                    SELECT MAX(created_at) 
                    FROM messages 
                    WHERE match_id = m.match_id
                ) as last_message_time,
                (
                    SELECT COUNT(*) 
                    FROM messages 
                    WHERE match_id = m.match_id 
                    AND receiver_id = :userId 
                    AND is_read = false
                ) as unread_count
            FROM matches m
            JOIN users u ON (
                CASE 
                    WHEN m.user1_id = :userId THEN m.user2_id
                    ELSE m.user1_id
                END = u.user_id
            )
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE m.user1_id = :userId OR m.user2_id = :userId
            ORDER BY last_message_time DESC NULLS LAST, m.created_at DESC
        `, {
            replacements: { userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(matches);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Server error getting conversations' });
    }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
    const { matchId } = req.params;

    try {
        // Verify that the match exists and the user is part of it
        const match = await sequelize.query(`
            SELECT * FROM matches
            WHERE match_id = :matchId
            AND (user1_id = :userId OR user2_id = :userId)
        `, {
            replacements: { matchId, userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        if (match.length === 0) {
            return res.status(404).json({ message: 'Match not found or you are not part of it' });
        }

        // Get all messages
        const messages = await sequelize.query(`
            SELECT 
                m.message_id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.is_read,
                m.created_at,
                u.username as sender_username,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name,
                p.file_path as sender_profile_picture
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_profile = true
            WHERE m.match_id = :matchId
            ORDER BY m.created_at ASC
        `, {
            replacements: { matchId },
            type: sequelize.QueryTypes.SELECT
        });

        // Mark messages as read if they were sent to the current user
        await sequelize.query(`
            UPDATE messages
            SET is_read = true
            WHERE match_id = :matchId
            AND receiver_id = :userId
            AND is_read = false
        `, {
            replacements: { matchId, userId: req.user.id }
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error getting messages' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    const { matchId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    try {
        // Verify that the match exists and the user is part of it
        const match = await sequelize.query(`
            SELECT * FROM matches
            WHERE match_id = :matchId
            AND (user1_id = :userId OR user2_id = :userId)
        `, {
            replacements: { matchId, userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        if (match.length === 0) {
            return res.status(404).json({ message: 'Match not found or you are not part of it' });
        }

        // Determine the receiver ID
        const receiverId = match[0].user1_id === req.user.id ? match[0].user2_id : match[0].user1_id;

        // Create message
        const result = await sequelize.query(`
            INSERT INTO messages (match_id, sender_id, receiver_id, content, is_read, created_at)
            VALUES (:matchId, :senderId, :receiverId, :content, false, NOW())
            RETURNING message_id, created_at
        `, {
            replacements: {
                matchId,
                senderId: req.user.id,
                receiverId,
                content
            },
            type: sequelize.QueryTypes.INSERT
        });

        const messageId = result[0][0].message_id;
        const createdAt = result[0][0].created_at;

        // Create notification
        await createNotification(receiverId, 'message', req.user.id, messageId);

        // Return the new message
        const newMessage = {
            message_id: messageId,
            sender_id: req.user.id,
            receiver_id: receiverId,
            content,
            is_read: false,
            created_at: createdAt
        };

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    const { messageId } = req.params;

    try {
        // Verify that the message exists and the user is the sender
        const message = await sequelize.query(`
            SELECT * FROM messages
            WHERE message_id = :messageId
            AND sender_id = :userId
        `, {
            replacements: { messageId, userId: req.user.id },
            type: sequelize.QueryTypes.SELECT
        });

        if (message.length === 0) {
            return res.status(404).json({ message: 'Message not found or you are not the sender' });
        }

        // Delete the message
        await sequelize.query(`
            DELETE FROM messages
            WHERE message_id = :messageId
        `, {
            replacements: { messageId }
        });

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error deleting message' });
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