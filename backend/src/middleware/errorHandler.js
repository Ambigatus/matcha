// backend/src/middleware/errorHandler.js

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    console.error('Error occurred:', err);

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));

        return res.status(400).json({
            message: 'Validation error',
            errors
        });
    }

    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));

        return res.status(409).json({
            message: 'Duplicate entry error',
            errors
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expired'
        });
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        let message = 'File upload error';

        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        }

        return res.status(400).json({
            message
        });
    }

    // Custom error types with status code
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }

    // Default error handling
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        message,
        // Only show stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Custom error class with status code
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async function wrapper to avoid try/catch blocks
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = {
    errorHandler,
    AppError,
    catchAsync
};