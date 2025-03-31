// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set auth token for requests
    const setAuthToken = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    };

    // Load user from token
    const loadUser = async () => {
        if (token) {
            setAuthToken(token);
            try {
                const res = await axios.get('/api/profile/me');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                setAuthToken(null);
            }
        }
        setLoading(false);
    };

    // Register user
    const register = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post('/api/auth/register', formData);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during registration');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Login user
    const login = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post('/api/auth/login', formData);
            const { token } = res.data;
            setToken(token);
            setAuthToken(token);
            await loadUser();
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during login');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Verify email
    const verifyEmail = async (token) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`/api/auth/verify-email/${token}`);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during verification');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Logout user
    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setAuthToken(null);
        }
    };

    // Forgot password
    const forgotPassword = async (email) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post('/api/auth/forgot-password', { email });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Reset password
    const resetPassword = async (token, password) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.post(`/api/auth/reset-password/${token}`, { password });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during password reset');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Set default axios baseURL
    useEffect(() => {
        axios.defaults.baseURL = 'http://localhost:5000';

        // Load user when component mounts
        loadUser();

        // eslint-disable-next-line
    }, []);

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
                resetPassword
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;