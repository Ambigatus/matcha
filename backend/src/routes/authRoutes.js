// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.post('/logout', protect, authController.logout);

// Add this to your authRoutes.js file:
router.get('/test-email', (req, res) => {
    try {
        require('../utils/email').sendVerificationEmail('your_test_email@example.com', 'test-token');
        res.status(200).json({ message: 'Test email sent. Check your inbox and server logs.' });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ message: 'Error sending test email', error: error.message });
    }
});

module.exports = router;