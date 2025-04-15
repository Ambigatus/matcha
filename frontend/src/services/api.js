// frontend/src/services/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Get API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create a custom axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle specific error cases
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 401:
                    // Authentication error - clear token and redirect to login
                    if (localStorage.getItem('token')) {
                        localStorage.removeItem('token');
                        toast.error('Your session has expired. Please log in again.');
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    toast.error(data.message || 'You don\'t have permission to access this resource');
                    break;
                case 404:
                    // Not found error - do not display toast for these
                    break;
                case 500:
                    toast.error(data.message || 'Server error. Please try again later.');
                    break;
                default:
                    // Other errors
                    if (data.message) {
                        toast.error(data.message);
                    }
                    break;
            }
        } else if (error.request) {
            // The request was made but no response was received
            toast.error('Network error. Please check your connection and try again.');
        } else {
            // Something happened in setting up the request that triggered an Error
            toast.error('Application error. Please try again.');
        }

        return Promise.reject(error);
    }
);

// API service functions
const apiService = {
    // Authentication
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/api/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/api/auth/verify-email/${token}`),
    logout: () => api.post('/api/auth/logout'),

    // Profile
    getProfile: () => api.get('/api/profile/me'),
    updateProfile: (profileData) => api.put('/api/profile/update', profileData),
    addTag: (tagName) => api.post('/api/profile/tags', { tagName }),
    removeTag: (tagId) => api.delete(`/api/profile/tags/${tagId}`),
    uploadPhoto: (formData) => api.post('/api/profile/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    setProfilePhoto: (photoId) => api.put(`/api/profile/photos/${photoId}/set-profile`),
    deletePhoto: (photoId) => api.delete(`/api/profile/photos/${photoId}`),

    // Browse
    getSuggestions: () => api.get('/api/browse/suggestions'),
    searchUsers: (params) => api.get('/api/browse/search', { params }),
    getProfileById: (profileId) => api.get(`/api/browse/profile/${profileId}`),

    // Interactions
    likeUser: (userId) => api.post(`/api/interactions/like/${userId}`),
    unlikeUser: (userId) => api.delete(`/api/interactions/like/${userId}`),
    blockUser: (userId) => api.post(`/api/interactions/block/${userId}`),
    unblockUser: (userId) => api.delete(`/api/interactions/block/${userId}`),
    reportUser: (userId, reason) => api.post(`/api/interactions/report/${userId}`, { reason }),
    getLikes: () => api.get('/api/interactions/likes'),
    getMatches: () => api.get('/api/interactions/matches'),
    getBlocks: () => api.get('/api/interactions/blocks'),

    // Notifications
    getNotifications: () => api.get('/api/notifications'),
    markNotificationAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
    markAllNotificationsAsRead: () => api.put('/api/notifications/read-all'),
    deleteNotification: (notificationId) => api.delete(`/api/notifications/${notificationId}`),
    deleteAllNotifications: () => api.delete('/api/notifications'),

    // Chat
    getConversations: () => api.get('/api/chat/conversations'),
    getMessages: (matchId) => api.get(`/api/chat/messages/${matchId}`),
    sendMessage: (matchId, content) => api.post(`/api/chat/messages/${matchId}`, { content }),
    deleteMessage: (messageId) => api.delete(`/api/chat/messages/${messageId}`)
};

export default apiService;