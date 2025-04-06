// backend/src/routes/browseRoutes.js
const express = require('express');
const router = express.Router();
const browseController = require('../controllers/browseController');
const { protect } = require('../middleware/auth');

// All browse routes should be protected - require authentication
router.use(protect);

// Get suggested profiles based on user preferences
router.get('/suggestions', browseController.getSuggestions);

// Search profiles with filters
router.get('/search', browseController.searchUsers);

// Get a specific profile
router.get('/profile/:profileId', browseController.getProfile);

module.exports = router;