// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user
        const result = await db.query(
            'SELECT user_id, username, email, first_name, last_name, is_admin FROM users WHERE user_id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Attach user to request
        req.user = {
            id: result.rows[0].user_id,
            username: result.rows[0].username,
            email: result.rows[0].email,
            firstName: result.rows[0].first_name,
            lastName: result.rows[0].last_name,
            isAdmin: result.rows[0].is_admin
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};