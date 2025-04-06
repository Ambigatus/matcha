// frontend/src/pages/profile/ProfileEdit.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import PhotoManagement from './PhotoManagement';
import TagsInput from '../../components/profile/TagsInput';

const ProfileEdit = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/profile/me');
                setProfile(response.data);
            } catch (error) {
                toast.error('Failed to load profile. Please try again.');
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const ProfileSchema = Yup.object().shape({
        gender: Yup.string()
            .required('Gender is required'),
        sexualPreference: Yup.string()
            .required('Sexual preference is required'),
        bio: Yup.string()
            .max(500, 'Bio must be less than 500 characters'),
        birthDate: Yup.date()
            .required('Birth date is required')
            .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old')
            .min(new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000), 'Invalid birth date'),
        latitude: Yup.number()
            .nullable(),
        longitude: Yup.number()
            .nullable(),
        lastLocation: Yup.string()
    });

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setSavingProfile(true);
            await axios.put('/api/profile/update', values);
            toast.success('Profile updated successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error('Failed to update profile. Please try again.');
            console.error('Error updating profile:', error);
        } finally {
            setSubmitting(false);
            setSavingProfile(false);
        }
    };

    const handleGetLocation = (setFieldValue) => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        toast.info('Getting your location...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setFieldValue('latitude', position.coords.latitude);
                setFieldValue('longitude', position.coords.longitude);

                // Get location name using OpenStreetMap API
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
                    );
                    const data = await response.json();
                    const locationName = data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        data.address?.county ||
                        'Unknown location';

                    setFieldValue('lastLocation', locationName);
                    toast.success('Location found: ' + locationName);
                } catch (error) {
                    console.error('Error getting location name:', error);
                    setFieldValue('lastLocation', 'Location detected');
                    toast.warning('Location coordinates found, but could not determine city name');
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                toast.error('Unable to retrieve your location. Please enter it manually.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Initialize form values from profile data
    const initialValues = {
        gender: profile?.gender || '',
        sexualPreference: profile?.sexual_preference || 'bisexual',
        bio: profile?.bio || '',
        birthDate: profile?.birth_date ? new Date(profile.birth_date).toISOString().split('T')[0] : '',
        latitude: profile?.latitude || null,
        longitude: profile?.longitude || null,
        lastLocation: profile?.last_location || ''
    };

    const isNewProfile = !profile?.gender;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="px-8 py-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isNewProfile ? 'Complete Your Profile' : 'Edit Profile'}
                    </h1>
                    {isNewProfile && (
                        <p className="mt-2 text-gray-600">
                            Please fill out your profile information to start matching with other users.
                        </p>
                    )}
                </div>

                <div className="p-8">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={ProfileSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ isSubmitting, setFieldValue, values }) => (
                            <Form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Personal Information */}
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>

                                        <div className="mb-4">
                                            <label htmlFor="gender" className="block text-gray-700 font-medium mb-2">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="gender"
                                                id="gender"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">Select your gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </Field>
                                            <ErrorMessage name="gender" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="sexualPreference" className="block text-gray-700 font-medium mb-2">
                                                Sexual Preference <span className="text-red-500">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="sexualPreference"
                                                id="sexualPreference"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="heterosexual">Heterosexual</option>
                                                <option value="homosexual">Homosexual</option>
                                                <option value="bisexual">Bisexual</option>
                                            </Field>
                                            <ErrorMessage name="sexualPreference" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="birthDate" className="block text-gray-700 font-medium mb-2">
                                                Birth Date <span className="text-red-500">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="birthDate"
                                                id="birthDate"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <ErrorMessage name="birthDate" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                    </div>

                                    {/* Location Information */}
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>
                                        <p className="text-gray-600 mb-4">
                                            We use your location to suggest matches near you. You can either:
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => handleGetLocation(setFieldValue)}
                                            className="mb-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Use My Current Location
                                        </button>

                                        <p className="text-gray-600 mb-4">Or enter your location manually:</p>

                                        <div className="mb-4">
                                            <label htmlFor="lastLocation" className="block text-gray-700 font-medium mb-2">
                                                City/Region
                                            </label>
                                            <Field
                                                type="text"
                                                name="lastLocation"
                                                id="lastLocation"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="e.g., Paris, France"
                                            />
                                            <ErrorMessage name="lastLocation" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="mb-4">
                                                <label htmlFor="latitude" className="block text-gray-700 font-medium mb-2">
                                                    Latitude
                                                </label>
                                                <Field
                                                    type="number"
                                                    step="0.000001"
                                                    name="latitude"
                                                    id="latitude"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Latitude"
                                                />
                                                <ErrorMessage name="latitude" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="longitude" className="block text-gray-700 font-medium mb-2">
                                                    Longitude
                                                </label>
                                                <Field
                                                    type="number"
                                                    step="0.000001"
                                                    name="longitude"
                                                    id="longitude"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Longitude"
                                                />
                                                <ErrorMessage name="longitude" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Biography */}
                                <div className="mb-8">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">About Me</h2>

                                    <div className="mb-4">
                                        <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
                                            Biography
                                        </label>
                                        <Field
                                            as="textarea"
                                            name="bio"
                                            id="bio"
                                            rows="5"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Tell others about yourself..."
                                        />
                                        <ErrorMessage name="bio" component="div" className="text-red-500 text-sm mt-1" />
                                        <p className="text-gray-500 text-sm mt-1">
                                            {values.bio ? `${values.bio.length}/500 characters` : '0/500 characters'}
                                        </p>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    {!isNewProfile && (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/profile')}
                                            className="mr-4 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || savingProfile}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        {savingProfile ? 'Saving...' : isNewProfile ? 'Continue' : 'Save Changes'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            {/* Only show the photo management and tags sections if this is not a new profile */}
            {!isNewProfile && (
                <>
                    {/* Tags Section */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                        <div className="px-8 py-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Interests & Tags</h2>
                        </div>

                        <div className="p-8">
                            <TagsInput userId={user.id} initialTags={profile.tags || []} />
                        </div>
                    </div>

                    {/* Photo Management Section */}
                    <PhotoManagement />
                </>
            )}
        </div>
    );
};

export default ProfileEdit;