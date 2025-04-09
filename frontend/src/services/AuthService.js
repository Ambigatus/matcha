// frontend/src/services/AuthService.js
import axios from 'axios';
import { handleApiError } from '../utils/errorUtils';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Service for handling authentication-related API requests
 */
class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} - Promise resolving to registration response
     */
    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, userData);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Registration failed', { showToast: false });
        }
    }

    /**
     * Log in a user
     * @param {Object} credentials - User login credentials
     * @returns {Promise} - Promise resolving to login response with token
     */
    async login(credentials) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, credentials);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                this.setAuthHeader(response.data.token);
            }

            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Login failed', { showToast: false });
        }
    }

    /**
     * Log out the current user
     * @returns {Promise} - Promise resolving when logout is complete
     */
    async logout() {
        try {
            // Only attempt to call the logout endpoint if we have a token
            if (this.getToken()) {
                await axios.post(`${API_URL}/api/auth/logout`);
            }
        } catch (error) {
            console.error('Logout error:', error);
            // We still want to clear the token even if the API call fails
        } finally {
            localStorage.removeItem('token');
            this.removeAuthHeader();
        }
    }

    /**
     * Send password reset request
     * @param {string} email - User's email address
     * @returns {Promise} - Promise resolving to password reset response
     */
    async forgotPassword(email) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to send password reset email', { showToast: false });
        }
    }

    /**
     * Reset user's password with reset token
     * @param {string} token - Password reset token
     * @param {string} password - New password
     * @returns {Promise} - Promise resolving to password reset response
     */
    async resetPassword(token, password) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to reset password', { showToast: false });
        }
    }

    /**
     * Verify user's email with verification token
     * @param {string} token - Email verification token
     * @returns {Promise} - Promise resolving to verification response
     */
    async verifyEmail(token) {
        try {
            const response = await axios.get(`${API_URL}/api/auth/verify-email/${token}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Email verification failed', { showToast: false });
        }
    }

    /**
     * Get the current user's profile
     * @returns {Promise} - Promise resolving to user profile data
     */
    async getCurrentUser() {
        try {
            const response = await axios.get(`${API_URL}/api/profile/me`);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to get user profile', { showToast: false });
        }
    }

    /**
     * Check if user is authenticated (has valid token)
     * @returns {boolean} - True if user has a token
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get the authentication token from storage
     * @returns {string|null} - The auth token or null if not found
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Set the authorization header for all future axios requests
     * @param {string} token - JWT token
     */
    setAuthHeader(token) {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }

    /**
     * Remove the authorization header
     */
    removeAuthHeader() {
        delete axios.defaults.headers.common['Authorization'];
    }

    /**
     * Initialize the auth service (setup axios defaults)
     */
    initializeAuth() {
        const token = this.getToken();
        if (token) {
            this.setAuthHeader(token);
        }
    }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;