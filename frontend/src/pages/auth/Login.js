// frontend/src/pages/auth/Login.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Validation schema
    const LoginSchema = Yup.object().shape({
        username: Yup.string().required('Username is required'),
        password: Yup.string().required('Password is required')
    });

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            await login(values);
            toast.success('Login successful!');
            navigate('/profile');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';

            // Special case for email verification
            if (errorMessage.includes('verify your email')) {
                toast.error(errorMessage, {
                    autoClose: 5000
                });
            } else {
                toast.error(errorMessage);
            }

            setErrors({ submit: errorMessage });
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
                    {({ isSubmitting, errors }) => (
                        <Form>
                            {errors.submit && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    {errors.submit}
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <div className="text-center mt-4">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-600 hover:text-indigo-800">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;