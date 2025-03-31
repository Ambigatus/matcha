// frontend/src/pages/auth/VerifyEmail.js
import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const VerifyEmail = () => {
    const { verifyEmail } = useContext(AuthContext);
    const { token } = useParams();
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyUserEmail = async () => {
            try {
                if (token) {
                    await verifyEmail(token);
                    setVerified(true);
                    toast.success('Email verified successfully! You can now log in.');
                } else {
                    setError('Invalid verification link');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Verification failed. Please try again.');
                toast.error(err.response?.data?.message || 'Verification failed');
            } finally {
                setVerifying(false);
            }
        };

        verifyUserEmail();
    }, [token, verifyEmail]);

    if (verifying) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying your email...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8 text-center">
                {verified ? (
                    <>
                        <div className="text-green-500 text-6xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Verified!</h2>
                        <p className="text-gray-600 mb-6">
                            Your email has been successfully verified. You can now log in to your account.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        >
                            Go to Login
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="text-red-500 text-6xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h2>
                        <p className="text-gray-600 mb-6">
                            {error || 'Your verification link is invalid or has expired.'}
                        </p>
                        <Link
                            to="/login"
                            className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        >
                            Back to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;