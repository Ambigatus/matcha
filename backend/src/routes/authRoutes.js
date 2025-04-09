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

router.get('/test-email', async (req, res) => {
    try {
        const emailService = require('../utils/email');
        const result = await emailService.testEmailService();

        if (result.success) {
            res.status(200).json({
                message: 'Test email sent successfully.',
                emailConfig: {
                    sendGrid: result.sendGrid,
                    nodemailer: result.nodemailer
                }
            });
        } else {
            res.status(500).json({
                message: 'Failed to send test email',
                error: result.error,
                emailConfig: {
                    sendGrid: result.sendGrid,
                    nodemailer: result.nodemailer
                }
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ message: 'Error sending test email', error: error.message });
    }
});

module.exports = router;