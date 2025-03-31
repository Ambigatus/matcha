// frontend/src/pages/auth/Register.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const Register = () => {
    const { register } = useContext(AuthContext);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Validation schema
    const RegisterSchema = Yup.object().shape({
        username: Yup.string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username must be less than 50 characters')
            .matches(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
            .required('Username is required'),
        email: Yup.string()
            .email('Invalid email address')
            .required('Email is required'),
        firstName: Yup.string()
            .required('First name is required'),
        lastName: Yup.string()
            .required('Last name is required'),
        password: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('Password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Confirm password is required')
    });

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            const { confirmPassword, ...registerData } = values;
            await register(registerData);
            setSuccess(true);
            toast.success('Registration successful! Please check your email to verify your account.');
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(errorMessage);
            setErrors({ submit: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>

                {success ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <p className="text-center">Registration successful! Please check your email to verify your account.</p>
                        <p className="text-center mt-2">
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
                                Continue to Login
                            </Link>
                        </p>
                    </div>
                ) : (
                    <Formik
                        initialValues={{
                            username: '',
                            email: '',
                            firstName: '',
                            lastName: '',
                            password: '',
                            confirmPassword: ''
                        }}
                        validationSchema={RegisterSchema}
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

                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                        Email
                                    </label>
                                    <Field
                                        type="email"
                                        name="email"
                                        id="email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">
                                            First Name
                                        </label>
                                        <Field
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">
                                            Last Name
                                        </label>
                                        <Field
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                                        Password
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
                                        Confirm Password
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
                                    {isSubmitting ? 'Registering...' : 'Register'}
                                </button>
                            </Form>
                        )}
                    </Formik>
                )}

                <div className="text-center mt-4">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;