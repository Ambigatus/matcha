// frontend/src/pages/auth/ResetPassword.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);

    // Validation schema
    const ResetPasswordSchema = Yup.object().shape({
        password: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('Password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Confirm password is required')
    });

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            await axios.post(`/api/auth/reset-password/${token}`, {
                password: values.password
            });
            setSuccess(true);
            toast.success('Password reset successful! You can now log in with your new password.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Password reset failed. Please try again.';
            toast.error(errorMessage);
            setErrors({ submit: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Reset Your Password</h2>

                {success ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <p className="text-center">Password reset successful! You can now log in with your new password.</p>
                        <p className="text-center mt-2">
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
                                Go to Login
                            </Link>
                        </p>
                    </div>
                ) : (
                    <Formik
                        initialValues={{
                            password: '',
                            confirmPassword: ''
                        }}
                        validationSchema={ResetPasswordSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, errors }) => (
                            <Form>
                                {errors.submit && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        {errors.submit}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                                        New Password
                                    </label>
                                    <Field
                                        type="password"
                                        name="password"
                                        id="password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                                        Confirm New Password
                                    </label>
                                    <Field
                                        type="password"
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                                >
                                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </Form>
                        )}
                    </Formik>
                )}

                <div className="text-center mt-4">
                    <p className="text-gray-600">
                        Remember your password?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;