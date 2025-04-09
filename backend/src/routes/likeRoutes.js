// backend/src/routes/likeRoutes.js
const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { protect } = require('../middleware/auth');

// All like routes should be protected
router.use(protect);

// Like and unlike users
router.post('/:targetId', likeController.likeUser);
router.delete('/:targetId', likeController.unlikeUser);

// Check if two users are matched
router.get('/match/:targetId', likeController.checkMatch);

// Get users who liked the current user
router.get('/liked-by', likeController.getLikedBy);

// Get users the current user has liked
router.get('/liked', likeController.getLiked);

// Get matches
router.get('/matches', likeController.getMatches);

module.exports = router;