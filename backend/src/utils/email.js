// backend/src/utils/email.js
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize SendGrid if API key is available
let sendGridInitialized = false;
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridInitialized = true;
} else {
    console.warn('SendGrid API key not found, will use Nodemailer fallback');
}

// Create a test SMTP service account for development fallback
const createTestAccount = async () => {
    try {
        return await nodemailer.createTestAccount();
    } catch (error) {
        console.error('Failed to create test email account:', error);
        return null;
    }
};

// Create reusable transporter for Nodemailer (fallback)
let nodemailerTransporter = null;
const initNodemailer = async () => {
    try {
        // If we have explicit SMTP settings, use them
        if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
            nodemailerTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            return;
        }

        // Otherwise create a test account
        const testAccount = await createTestAccount();
        if (testAccount) {
            nodemailerTransporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('Nodemailer test account created, emails can be viewed at ethereal.email');
            console.log(`Username: ${testAccount.user}`);
            console.log(`Password: ${testAccount.pass}`);
        }
    } catch (error) {
        console.error('Failed to initialize Nodemailer:', error);
    }
};

// Initialize Nodemailer for fallback
initNodemailer();

// Function to send email with fallback
const sendEmail = async (to, subject, html) => {
    const msg = {
        to,
        from: process.env.EMAIL_USER || 'noreply@matcha.com',
        subject,
        html
    };

    try {
        // Try SendGrid first if initialized
        if (sendGridInitialized) {
            await sgMail.send(msg);
            console.log(`Email sent to ${to} via SendGrid`);
            return true;
        }

        // Fall back to Nodemailer
        if (nodemailerTransporter) {
            const info = await nodemailerTransporter.sendMail(msg);
            console.log(`Email sent to ${to} via Nodemailer`);

            // If using Ethereal, provide link to view email
            if (info.testMessageUrl) {
                console.log(`Preview URL: ${info.testMessageUrl}`);
            }

            return true;
        }

        // No available transport
        console.error('No email transport available. Configure SendGrid or SMTP.');
        return false;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

    const html = `
      <h1>Welcome to Matcha!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `;

    return await sendEmail(email, 'Verify Your Matcha Account', html);
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your Matcha account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    return await sendEmail(email, 'Reset Your Matcha Password', html);
};

// Test email functionality
exports.testEmailService = async () => {
    try {
        const result = await sendEmail(
            'test@example.com',
            'Matcha Email Test',
            '<h1>Test Email</h1><p>This is a test email from Matcha.</p>'
        );

        return {
            success: result,
            sendGrid: sendGridInitialized,
            nodemailer: !!nodemailerTransporter
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};