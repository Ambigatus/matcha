// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Determine API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set auth token for requests
    const setAuthToken = useCallback((token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    }, []);

    // Load user from token
    const loadUser = useCallback(async () => {
        if (token) {
            setAuthToken(token);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/profile/me`);
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                console.error('Error loading user:', err);
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                setAuthToken(null);
            }
        }
        setLoading(false);
    }, [token, setAuthToken]);

    // Register user
    const register = useCallback(async (formData) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during registration');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Login user
    const login = useCallback(async (formData) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
            const { token } = res.data;
            setToken(token);
            setAuthToken(token);
            await loadUser(); // Load user data after login

            // Set authenticated status to true so other components can react
            setIsAuthenticated(true);

            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during login');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setAuthToken, loadUser]);

    // Verify email
    const verifyEmail = useCallback(async (token) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${API_BASE_URL}/api/auth/verify-email/${token}`);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during verification');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Logout user
    const logout = useCallback(async () => {
        try {
            // Try to notify the server about logout
            if (isAuthenticated) {
                await axios.post(`${API_BASE_URL}/api/auth/logout`);
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setAuthToken(null);
        }
    }, [isAuthenticated, setAuthToken]);

    // Forgot password
    const forgotPassword = useCallback(async (email) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset password
    const resetPassword = useCallback(async (token, password) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, { password });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during password reset');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Set default axios baseURL
    useEffect(() => {
        axios.defaults.baseURL = API_BASE_URL;

        // Load user when component mounts
        loadUser();
    }, [loadUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                loading,
                error,
                register,
                login,
                logout,
                verifyEmail,
                forgotPassword,
                resetPassword,
                loadUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;