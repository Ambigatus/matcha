// frontend/src/components/layout/Header.js
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Header = () => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
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
                        <Link to="/" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                            Home
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                                    Profile
                                </Link>
                                <Link to="/browse" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                                    Browse
                                </Link>
                                <div className="relative group">
                                    <button className="flex items-center text-gray-700 hover:text-indigo-600 focus:outline-none">
                                        <span>{user ? user.username : 'Account'}</span>
                                        <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white">
                                            Your Profile
                                        </Link>
                                        <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white">
                                            Settings
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
                                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
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
                                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/browse"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Browse
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="text-left text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
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
