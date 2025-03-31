const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Verify Your Matcha Account',
        html: `
          <h1>Welcome to Matcha!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>This link will expire in 24 hours.</p>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Email sending error:', error);
    }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Reset Your Matcha Password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset for your Matcha account.</p>
          <p>Please click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Email sending error:', error);
    }
};
