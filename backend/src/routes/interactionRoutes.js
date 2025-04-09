// backend/src/routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');

// All interaction routes need authentication
router.use(protect);

// Like/Unlike routes
router.post('/like/:userId', interactionController.likeUser);
router.delete('/like/:userId', interactionController.unlikeUser);

// Block/Unblock routes
router.post('/block/:userId', interactionController.blockUser);
router.delete('/block/:userId', interactionController.unblockUser);

// Report user
router.post('/report/:userId', interactionController.reportUser);

// Get likes/matches/blocks
router.get('/likes', interactionController.getAllLikes);
router.get('/matches', interactionController.getMatches);
router.get('/blocks', interactionController.getBlockedUsers);

module.exports = router;