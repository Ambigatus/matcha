// backend/src/middleware/errorHandler.js

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
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log the error in development environment
    if (process.env.NODE_ENV === 'development') {
        console.error('Error occurred:', err);
    } else {
        // In production, log minimal information
        console.error(`${err.name}: ${err.message}`);
    }

    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errors = [];

    // Handle different types of errors

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        message = err.name === 'SequelizeValidationError' ? 'Validation error' : 'Duplicate entry error';
        errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
    }

    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token expired';
    }

    // Multer (file upload) errors
    else if (err.name === 'MulterError') {
        statusCode = 400;

        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        } else {
            message = 'File upload error';
        }
    }

    // Database connection errors
    else if (err.name === 'SequelizeConnectionError' ||
        err.name === 'SequelizeConnectionRefusedError' ||
        err.name === 'SequelizeHostNotFoundError' ||
        err.name === 'SequelizeConnectionTimedOutError') {
        statusCode = 503;
        message = 'Database connection error';
    }

    // Build the error response object
    const errorResponse = {
        success: false,
        status: statusCode,
        message
    };

    // Include detailed errors if they exist
    if (errors.length > 0) {
        errorResponse.errors = errors;
    }

    // Include stack trace in development mode only
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    // Send the error response
    res.status(statusCode).json(errorResponse);
};

// Helper function to check if an error is operational (expected)
const isOperationalError = (err) => {
    return err instanceof AppError ||
        err.name === 'SequelizeValidationError' ||
        err.name === 'SequelizeUniqueConstraintError' ||
        err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError' ||
        err.name === 'MulterError';
};

// Create standard error responses for common scenarios
const createNotFoundError = (resource = 'Resource') => {
    return new AppError(`${resource} not found`, 404);
};

const createUnauthorizedError = (message = 'Unauthorized access') => {
    return new AppError(message, 401);
};

const createForbiddenError = (message = 'Access forbidden') => {
    return new AppError(message, 403);
};

const createBadRequestError = (message = 'Bad request') => {
    return new AppError(message, 400);
};

const createConflictError = (message = 'Resource already exists') => {
    return new AppError(message, 409);
};

module.exports = {
    AppError,
    catchAsync,
    errorHandler,
    isOperationalError,
    createNotFoundError,
    createUnauthorizedError,
    createForbiddenError,
    createBadRequestError,
    createConflictError
};