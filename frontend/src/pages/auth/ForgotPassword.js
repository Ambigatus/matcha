// frontend/src/pages/auth/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';

const ForgotPassword = () => {
    const [emailSent, setEmailSent] = useState(false);

    // Validation schema
    const ForgotPasswordSchema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email')
            .required('Email is required')
    });

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await axios.post('/api/auth/forgot-password', values);
            setEmailSent(true);
            toast.success('If a matching account was found, a password reset email was sent');
        } catch (error) {
            // We don't show specific errors for security reasons
            toast.info('If a matching account was found, a password reset email was sent');
            // But we still set emailSent to true to prevent email enumeration
            setEmailSent(true);
            console.error('Forgot password error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Reset Your Password</h2>

                {emailSent ? (
                    <div className="text-center">
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            <p>If a matching account was found, we've sent an email with instructions to reset your password.</p>
                            <p className="mt-2">Please check your inbox and spam folder.</p>
                        </div>
                        <p className="mt-4 text-gray-600">
                            Remember your password? <Link to="/login" className="text-indigo-600 hover:text-indigo-800">Sign in</Link>
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="text-center text-gray-600 mb-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <Formik
                            initialValues={{ email: '' }}
                            validationSchema={ForgotPasswordSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ isSubmitting }) => (
                                <Form>
                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                            Email Address
                                        </label>
                                        <Field
                                            type="email"
                                            name="email"
                                            id="email"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="your.email@example.com"
                                        />
                                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </Form>
                            )}
                        </Formik>

                        <div className="text-center mt-4">
                            <p className="text-gray-600">
                                Remember your password? <Link to="/login" className="text-indigo-600 hover:text-indigo-800">Sign in</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;