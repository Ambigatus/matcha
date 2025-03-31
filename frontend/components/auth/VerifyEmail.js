// frontend/src/components/auth/VerifyEmail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const { token } = useParams();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await axios.get(`/api/auth/verify-email/${token}`);
                setVerified(true);
            } catch (err) {
                setError(err.response?.data?.message || 'Verification failed');
            } finally {
                setVerifying(false);
            }
        };

        verifyEmail();
    }, [token]);

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-lg">Verifying your email...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                {verified ? (
                    <>
                        <div className="text-green-500 text-6xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Email Verified!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Your email has been successfully verified. You can now login to your account.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Go to Login
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-red-500 text-6xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Verification Failed
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {error || 'Your verification link is invalid or has expired.'}
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;