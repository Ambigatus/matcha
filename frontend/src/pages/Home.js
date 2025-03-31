// frontend/src/pages/Home.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Home = () => {
    const { isAuthenticated, user } = useContext(AuthContext);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <section className="py-12 md:py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Find Your Perfect Match with Matcha
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Connect with like-minded individuals based on your interests, preferences, and location.
                    Our intelligent algorithm helps you find the most compatible matches.
                </p>

                {!isAuthenticated ? (
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors duration-200 text-lg font-medium"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="bg-white text-indigo-600 border border-indigo-600 py-3 px-6 rounded-md hover:bg-gray-50 transition-colors duration-200 text-lg font-medium"
                        >
                            Sign In
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/browse"
                            className="bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors duration-200 text-lg font-medium"
                        >
                            Browse Matches
                        </Link>
                        <Link
                            to="/profile"
                            className="bg-white text-indigo-600 border border-indigo-600 py-3 px-6 rounded-md hover:bg-gray-50 transition-colors duration-200 text-lg font-medium"
                        >
                            View Profile
                        </Link>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className="py-12 bg-gray-50 rounded-xl my-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">How Matcha Works</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-indigo-600 text-4xl mb-4">1</div>
                            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                            <p className="text-gray-600">
                                Fill out your profile with information about yourself, your interests, and what you're looking for in a partner.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-indigo-600 text-4xl mb-4">2</div>
                            <h3 className="text-xl font-semibold mb-2">Discover Matches</h3>
                            <p className="text-gray-600">
                                Our algorithm will suggest people who match your preferences, have common interests, and are near your location.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-indigo-600 text-4xl mb-4">3</div>
                            <h3 className="text-xl font-semibold mb-2">Connect and Chat</h3>
                            <p className="text-gray-600">
                                When you and another user both like each other, you can start chatting and get to know each other better.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 text-center">
                <h2 className="text-3xl font-bold mb-6">Ready to Find Your Match?</h2>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Join thousands of users who have already found their perfect match on Matcha.
                </p>

                {!isAuthenticated ? (
                    <Link
                        to="/register"
                        className="bg-indigo-600 text-white py-3 px-8 rounded-md hover:bg-indigo-700 transition-colors duration-200 text-lg font-medium"
                    >
                        Get Started Today
                    </Link>
                ) : (
                    <Link
                        to="/browse"
                        className="bg-indigo-600 text-white py-3 px-8 rounded-md hover:bg-indigo-700 transition-colors duration-200 text-lg font-medium"
                    >
                        Find Matches Now
                    </Link>
                )}
            </section>
        </div>
    );
};

export default Home;