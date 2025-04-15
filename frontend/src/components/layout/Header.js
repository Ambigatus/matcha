// frontend/src/components/layout/Header.js
import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';

const Header = () => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Fetch notification count when user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const fetchNotifications = async () => {
                try {
                    const response = await axios.get('/api/notifications');
                    setNotificationCount(response.data.unreadCount || 0);
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                    // Silent fail - not critical for UX
                }
            };

            fetchNotifications();

            // Set up interval to check notifications (every 30 seconds)
            const interval = setInterval(fetchNotifications, 30000);

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, location.pathname]);

    const handleLogout = async () => {
        await logout();
        setIsMenuOpen(false);
        navigate('/login');
    };

    return (
        <header className="bg-white shadow">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-indigo-600">
                            Matcha
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            type="button"
                            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                            aria-label="Toggle menu"
                        >
                            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                                {isMenuOpen ? (
                                    <path
                                        fillRule="evenodd"
                                        d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                                    />
                                ) : (
                                    <path
                                        fillRule="evenodd"
                                        d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Desktop navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            to="/"
                            className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                location.pathname === '/' ? 'text-indigo-600 font-medium' : ''
                            }`}
                        >
                            Home
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/browse"
                                    className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                        location.pathname === '/browse' ? 'text-indigo-600 font-medium' : ''
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Discover
                                    </div>
                                </Link>

                                <Link
                                    to="/matches"
                                    className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                        location.pathname === '/matches' ? 'text-indigo-600 font-medium' : ''
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        Matches
                                    </div>
                                </Link>

                                <Link
                                    to="/profile"
                                    className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                        location.pathname === '/profile' ? 'text-indigo-600 font-medium' : ''
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </div>
                                </Link>

                                <div className="relative">
                                    <Link
                                        to="/notifications"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>

                                        {notificationCount > 0 && (
                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </Link>
                                </div>

                                <div className="relative group">
                                    <button className="flex items-center text-gray-700 hover:text-indigo-600 focus:outline-none">
                                        <span>{user ? user.username : 'Account'}</span>
                                        <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white"
                                        >
                                            Your Profile
                                        </Link>

                                        <Link
                                            to="/profile/edit"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white"
                                        >
                                            Edit Profile
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                        location.pathname === '/login' ? 'text-indigo-600 font-medium' : ''
                                    }`}
                                >
                                    Sign in
                                </Link>

                                <Link
                                    to="/register"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="block md:hidden py-4 border-t border-gray-200">
                        <nav className="flex flex-col space-y-2">
                            <Link
                                to="/"
                                className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                    location.pathname === '/' ? 'text-indigo-600 font-medium' : ''
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/browse"
                                        className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                            location.pathname === '/browse' ? 'text-indigo-600 font-medium' : ''
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Discover
                                    </Link>

                                    <Link
                                        to="/matches"
                                        className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                            location.pathname === '/matches' ? 'text-indigo-600 font-medium' : ''
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Matches
                                    </Link>

                                    <Link
                                        to="/profile"
                                        className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                            location.pathname === '/profile' ? 'text-indigo-600 font-medium' : ''
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>

                                    <Link
                                        to="/notifications"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 flex items-center"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Notifications
                                        {notificationCount > 0 && (
                                            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </Link>

                                    <Link
                                        to="/profile/edit"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Edit Profile
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="text-left text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className={`text-gray-700 hover:text-indigo-600 transition-colors duration-200 ${
                                            location.pathname === '/login' ? 'text-indigo-600 font-medium' : ''
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Sign in
                                    </Link>

                                    <Link
                                        to="/register"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;