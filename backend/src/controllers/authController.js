// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Profile } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { Op } = require('sequelize');

// Register a new user
exports.register = async (req, res) => {
    const { username, email, firstName, lastName, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Create new user
        const user = await User.create({
            username,
            email,
            first_name: firstName,
            last_name: lastName,
            password, // Will be hashed by the model hook
            verification_token: verificationToken
        });

        // Create empty profile
        await Profile.create({
            user_id: user.user_id
        });

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
        const user = await User.findOne({
            where: { verification_token: token }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.is_verified = true;
        user.verification_token = null;
        await user.save();

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
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if account is verified
        if (!user.is_verified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check password
        const isMatch = await user.validatePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login and online status
        user.last_login = new Date();
        user.is_online = true;
        await user.save();

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

        // Find user and update reset token
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({
                message: 'If a matching account was found, a password reset email was sent'
            });
        }

        // Save token to user
        user.password_reset_token = resetToken;
        user.password_reset_expires = resetExpires;
        await user.save();

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
        const user = await User.findOne({
            where: {
                password_reset_token: token,
                password_reset_expires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password and clear reset token
        user.password = password; // Will be hashed by model hook
        user.password_reset_token = null;
        user.password_reset_expires = null;
        await user.save();

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
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.is_online = false;
            await user.save();
        }

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};