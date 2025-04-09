// backend/src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const photoController = require('../controllers/photoController');
const { protect } = require('../middleware/auth');

// All profile routes are protected
router.use(protect);

// Profile routes
router.get('/me', profileController.getMyProfile);
router.put('/update', profileController.updateProfile);

// Tags routes
router.post('/tags', profileController.addTag);
router.delete('/tags/:tagId', profileController.removeTag);

// Photos routes - Using improved photo controller
router.post('/photos',
    photoController.uploadPhoto, // Middleware for handling file upload
    photoController.savePhoto    // Controller for saving to database
);
router.put('/photos/:photoId/set-profile', photoController.setProfilePhoto);
router.delete('/photos/:photoId', photoController.deletePhoto);

module.exports = router;