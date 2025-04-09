// frontend/src/pages/auth/Login.js
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { handleApiError, processFieldErrors } from '../../utils/errorUtils';

const Login = () => {
    const [formError, setFormError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Validation schema
    const LoginSchema = Yup.object().shape({
        username: Yup.string().required('Username is required'),
        password: Yup.string().required('Password is required')
    });

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            setFormError('');
            await login(values);
            toast.success('Login successful!');
            navigate('/profile');
        } catch (error) {
            // Handle field-specific errors if available
            if (error.response?.data?.errors) {
                processFieldErrors(error.response.data.errors, setErrors);
            }

            // Set general form error
            setFormError(
                error.response?.data?.message ||
                'Login failed. Please check your credentials and try again.'
            );

            // Log error for debugging
            console.error('Login error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>

                <Formik
                    initialValues={{
                        username: '',
                        password: ''
                    }}
                    validationSchema={LoginSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, errors, touched }) => (
                        <Form>
                            {formError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    {formError}
                                </div>
                            )}

                            <div className="mb-4">
                                <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                                    Username
                                </label>
                                <Field
                                    type="text"
                                    name="username"
                                    id="username"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                        errors.username && touched.username ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                <ErrorMessage name="username" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Field
                                    type="password"
                                    name="password"
                                    id="password"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                        errors.password && touched.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </div>
                                ) : 'Sign in'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;