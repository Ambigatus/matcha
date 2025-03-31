// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../utils/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// Register a new user
exports.register = async (req, res) => {
    const { username, email, firstName, lastName, password } = req.body;

    try {
        // Check if user already exists
        const userCheck = await db.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Insert new user
        const result = await db.query(
            `INSERT INTO users 
       (username, email, password, first_name, last_name, verification_token) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
            [username, email, hashedPassword, firstName, lastName, verificationToken]
        );

        const userId = result.rows[0].user_id;

        // Create empty profile
        await db.query(
            'INSERT INTO profiles (user_id) VALUES ($1)',
            [userId]
        );

        // Send verification email
        sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: 'User registered successfully. Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Verify user email
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const result = await db.query(
            'UPDATE users SET is_verified = TRUE WHERE verification_token = $1 RETURNING user_id',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

// Login user
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Get user
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check if account is verified
        if (!user.is_verified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login and online status
        await db.query(
            'UPDATE users SET last_login = NOW(), is_online = TRUE WHERE user_id = $1',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save token to user
        const result = await db.query(
            `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2 
       WHERE email = $3 RETURNING user_id`,
            [resetToken, resetExpires, email]
        );

        if (result.rows.length === 0) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({
                message: 'If a matching account was found, a password reset email was sent'
            });
        }

        // Send password reset email
        sendPasswordResetEmail(email, resetToken);

        res.status(200).json({
            message: 'Password reset email sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Find user with valid token
        const result = await db.query(
            `SELECT user_id FROM users 
       WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token
        await db.query(
            `UPDATE users 
       SET password = $1, password_reset_token = NULL, password_reset_expires = NULL 
       WHERE user_id = $2`,
            [hashedPassword, result.rows[0].user_id]
        );

        res.status(200).json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        // Update user's online status
        await db.query(
            'UPDATE users SET is_online = FALSE WHERE user_id = $1',
            [req.user.id]
        );

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};