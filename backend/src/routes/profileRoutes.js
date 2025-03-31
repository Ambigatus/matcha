// backend/src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// All profile routes are protected
router.use(protect);

// Profile routes
router.get('/me', profileController.getMyProfile);
router.put('/update', profileController.updateProfile);

// Tags routes
router.post('/tags', profileController.addTag);
router.delete('/tags/:tagId', profileController.removeTag);

// Photos routes
router.post('/photos', profileController.uploadPhoto);
router.put('/photos/:photoId/set-profile', profileController.setProfilePhoto);
router.delete('/photos/:photoId', profileController.deletePhoto);

module.exports = router;