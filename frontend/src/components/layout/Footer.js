// frontend/src/components/layout/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Matcha</h3>
                        <p className="text-gray-300">
                            Find your perfect match with our intelligent matching algorithm.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Navigation</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/browse" className="text-gray-300 hover:text-white transition-colors duration-200">
                                    Browse
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="text-gray-300 hover:text-white transition-colors duration-200">
                                    Profile
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors duration-200">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms-of-service" className="text-gray-300 hover:text-white transition-colors duration-200">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/cookie-policy" className="text-gray-300 hover:text-white transition-colors duration-200">
                                    Cookie Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-6 text-center">
                    <p className="text-gray-300">
                        &copy; {currentYear} Matcha Dating App. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;