// frontend/src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-9xl font-bold text-indigo-600">404</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mt-8 mb-4">Page Not Found</h2>
            <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                to="/"
                className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors duration-200"
            >
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;