// backend/src/socket/socketController.js
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('../models');

// Map to store online users: { userId: socketId }
const onlineUsers = new Map();

module.exports = (io) => {
    // Socket.io middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user to socket
            socket.userId = user.user_id;
            socket.user = {
                id: user.user_id,
                username: user.username
            };

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Add user to online users
        onlineUsers.set(socket.userId, socket.id);

        // Update user's online status
        await User.update(
            { is_online: true },
            { where: { user_id: socket.userId } }
        );

        // Join personal room based on userId for private messages
        socket.join(`user:${socket.userId}`);

        // Broadcast to all clients that a user is online
        io.emit('user_status_changed', {
            userId: socket.userId,
            isOnline: true
        });

        // Handle new message
        socket.on('send_message', async (data) => {
            try {
                const { matchId, receiverId, content } = data;

                if (!matchId || !receiverId || !content) {
                    return socket.emit('error', { message: 'Invalid message data' });
                }

                // Verify that the match exists and the user is part of it
                const match = await sequelize.query(`
                    SELECT * FROM matches
                    WHERE match_id = :matchId
                    AND (user1_id = :userId OR user2_id = :userId)
                `, {
                    replacements: { matchId, userId: socket.userId },
                    type: sequelize.QueryTypes.SELECT
                });

                if (match.length === 0) {
                    return socket.emit('error', { message: 'Match not found or you are not part of it' });
                }

                // Create message
                const result = await sequelize.query(`
                    INSERT INTO messages (match_id, sender_id, receiver_id, content, is_read, created_at)
                    VALUES (:matchId, :senderId, :receiverId, :content, false, NOW())
                    RETURNING message_id, created_at
                `, {
                    replacements: {
                        matchId,
                        senderId: socket.userId,
                        receiverId,
                        content
                    },
                    type: sequelize.QueryTypes.INSERT
                });

                const messageId = result[0][0].message_id;
                const createdAt = result[0][0].created_at;

                // Create notification
                await createNotification(receiverId, 'message', socket.userId, messageId);

                // Get sender info for the response
                const sender = await User.findByPk(socket.userId, {
                    attributes: ['username', 'first_name', 'last_name']
                });

                // Get sender profile picture
                const senderProfilePicture = await sequelize.query(`
                    SELECT file_path 
                    FROM photos
                    WHERE user_id = :userId AND is_profile = true
                    LIMIT 1
                `, {
                    replacements: { userId: socket.userId },
                    type: sequelize.QueryTypes.SELECT
                });

                // Format the message
                const newMessage = {
                    message_id: messageId,
                    match_id: matchId,
                    sender_id: socket.userId,
                    receiver_id: receiverId,
                    content,
                    is_read: false,
                    created_at: createdAt,
                    sender_username: sender.username,
                    sender_first_name: sender.first_name,
                    sender_last_name: sender.last_name,
                    sender_profile_picture: senderProfilePicture.length > 0 ? senderProfilePicture[0].file_path : null
                };

                // Send message to the receiver if they are online
                if (onlineUsers.has(receiverId)) {
                    io.to(`user:${receiverId}`).emit('new_message', newMessage);
                }

                // Send confirmation to sender
                socket.emit('message_sent', newMessage);
            } catch (error) {
                console.error('Send message socket error:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Handle message read status
        socket.on('mark_message_read', async (data) => {
            try {
                const { messageId } = data;

                // Update message
                await sequelize.query(`
                    UPDATE messages
                    SET is_read = true
                    WHERE message_id = :messageId
                    AND receiver_id = :userId
                `, {
                    replacements: { messageId, userId: socket.userId }
                });

                // Get sender ID to notify them
                const message = await sequelize.query(`
                    SELECT sender_id FROM messages
                    WHERE message_id = :messageId
                `, {
                    replacements: { messageId },
                    type: sequelize.QueryTypes.SELECT
                });

                if (message.length > 0) {
                    const senderId = message[0].sender_id;

                    // Notify sender if they are online
                    if (onlineUsers.has(senderId)) {
                        io.to(`user:${senderId}`).emit('message_read', { messageId });
                    }
                }
            } catch (error) {
                console.error('Mark message read socket error:', error);
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { matchId, receiverId } = data;

            // Forward typing indicator to receiver if they are online
            if (onlineUsers.has(receiverId)) {
                io.to(`user:${receiverId}`).emit('typing_indicator', {
                    matchId,
                    userId: socket.userId,
                    isTyping: true
                });
            }
        });

        // Handle stop typing
        socket.on('stop_typing', (data) => {
            const { matchId, receiverId } = data;

            // Forward stop typing to receiver if they are online
            if (onlineUsers.has(receiverId)) {
                io.to(`user:${receiverId}`).emit('typing_indicator', {
                    matchId,
                    userId: socket.userId,
                    isTyping: false
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.userId}`);

            // Remove user from online users
            onlineUsers.delete(socket.userId);

            // Update last login time and online status
            await User.update(
                {
                    is_online: false,
                    last_login: new Date()
                },
                { where: { user_id: socket.userId } }
            );

            // Broadcast to all clients that a user is offline
            io.emit('user_status_changed', {
                userId: socket.userId,
                isOnline: false,
                lastSeen: new Date()
            });
        });
    });
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