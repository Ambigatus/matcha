// backend/src/utils/sanitize.js
const xss = require('xss');

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input);
};

/**
 * Recursively sanitize an object's string properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Object with sanitized strings
 */
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    // Handle Date objects
    if (obj instanceof Date) return obj;

    // Handle regular objects
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip properties that should not be sanitized
        if (key === 'password') {
            result[key] = value;
            continue;
        }

        if (typeof value === 'string') {
            result[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value);
        } else {
            result[key] = value;
        }
    }

    return result;
};

/**
 * Express middleware to sanitize request body, query, and params
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeRequest = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }

    next();
};

module.exports = {
    sanitizeString,
    sanitizeObject,
    sanitizeRequest
};