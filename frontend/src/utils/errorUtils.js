// frontend/src/utils/errorUtils.js
import { toast } from 'react-toastify';

/**
 * Standardized error handling helper for API requests
 * @param {Error} error - Error object from axios catch block
 * @param {string} defaultMessage - Default message if no specific error message is found
 * @param {Object} options - Additional options for customizing error handling
 * @returns {string} - The error message that was displayed
 */
export const handleApiError = (error, defaultMessage = 'An error occurred. Please try again.', options = {}) => {
    // Extract options with defaults
    const {
        showToast = true,
        logToConsole = true,
        toastType = 'error',
        toastOptions = {},
        fieldErrorsCallback = null
    } = options;

    // Get error message from response if available
    let errorMessage = defaultMessage;
    let fieldErrors = [];

    if (error.response) {
        // Server responded with an error status
        const { data, status } = error.response;

        // Get the error message
        if (data.message) {
            errorMessage = data.message;
        }

        // Handle field-specific errors
        if (data.errors && Array.isArray(data.errors)) {
            fieldErrors = data.errors;

            // If there's a callback for field errors, execute it
            if (fieldErrorsCallback && typeof fieldErrorsCallback === 'function') {
                fieldErrorsCallback(fieldErrors);
            }
        }

        // Add status code if in development
        if (process.env.NODE_ENV === 'development') {
            errorMessage = `${errorMessage} (Status: ${status})`;
        }

        // Handle specific HTTP error codes
        switch (status) {
            case 401:
                // Unauthorized - Token expired or invalid
                if (window.location.pathname !== '/login') {
                    // Only redirect if we're not already on login page
                    toast.error('Your session has expired. Please login again.');
                    localStorage.removeItem('token');

                    // Delay redirect slightly to let the toast be visible
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);

                    return errorMessage;
                }
                break;

            case 403:
                // Forbidden - User doesn't have required permissions
                errorMessage = data.message || 'You don\'t have permission to access this resource';
                break;

            case 404:
                // Not Found
                errorMessage = data.message || 'The requested resource was not found';
                break;

            case 422:
                // Validation errors
                if (fieldErrors.length && !fieldErrorsCallback) {
                    // If no callback provided to handle field errors, show first error as toast
                    errorMessage = fieldErrors[0].message || errorMessage;
                }
                break;

            case 429:
                // Too Many Requests
                errorMessage = 'You\'ve made too many requests. Please try again later.';
                break;

            case 500:
                // Server Error
                errorMessage = 'Server error. Please try again later.';
                break;

            default:
                // Other error codes
                break;
        }
    } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Network error. Please check your connection and try again.';
    } else {
        // Error in setting up the request
        errorMessage = error.message || defaultMessage;
    }

    // Log error to console in development mode
    if (logToConsole) {
        console.error('API Error:', error);

        if (fieldErrors.length) {
            console.error('Field errors:', fieldErrors);
        }
    }

    // Show toast notification
    if (showToast) {
        toast[toastType](errorMessage, toastOptions);
    }

    return errorMessage;
};

/**
 * Form validation error handler - specifically for formik
 * @param {Object} errors - Formik form errors object
 * @returns {string|null} - First error message or null if no errors
 */
export const getFirstFormError = (errors) => {
    if (!errors || Object.keys(errors).length === 0) {
        return null;
    }

    // Find the first error
    const firstErrorKey = Object.keys(errors)[0];
    return errors[firstErrorKey];
};

/**
 * Process form field errors from API response for Formik
 * @param {Array} fieldErrors - Array of field error objects from API
 * @param {Function} setErrors - Formik's setErrors function
 */
export const processFieldErrors = (fieldErrors, setErrors) => {
    if (!fieldErrors || !Array.isArray(fieldErrors) || !setErrors) {
        return;
    }

    const formikErrors = {};

    fieldErrors.forEach(error => {
        if (error.field) {
            formikErrors[error.field] = error.message;
        }
    });

    if (Object.keys(formikErrors).length > 0) {
        setErrors(formikErrors);
    }
};

/**
 * Create an axios interceptor for handling errors
 * @param {AxiosInstance} axiosInstance - Axios instance to add interceptors to
 */
export const setupAxiosErrorInterceptor = (axiosInstance) => {
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            // Only handle certain errors automatically
            if (error.response && error.response.status === 401) {
                // Session expired
                if (localStorage.getItem('token') &&
                    window.location.pathname !== '/login' &&
                    window.location.pathname !== '/register') {
                    toast.error('Your session has expired. Please login again.');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            }

            // Always reject the promise so that local catch blocks can handle specific errors
            return Promise.reject(error);
        }
    );
};