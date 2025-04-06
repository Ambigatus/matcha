// backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All notification routes need authentication
router.use(protect);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;