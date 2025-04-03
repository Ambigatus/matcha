// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

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
        const user = await User.findByPk(decoded.id, {
            attributes: ['user_id', 'username', 'email', 'first_name', 'last_name', 'is_admin']
        });

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Attach user to request
        req.user = {
            id: user.user_id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            isAdmin: user.is_admin
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};