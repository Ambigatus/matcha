// backend/src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All chat routes need authentication
router.use(protect);

// Get all conversations
router.get('/conversations', chatController.getConversations);

// Get messages for a specific conversation
router.get('/messages/:matchId', chatController.getMessages);

// Send a message
router.post('/messages/:matchId', chatController.sendMessage);

// Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;