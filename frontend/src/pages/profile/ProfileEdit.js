// frontend/src/pages/profile/ProfileEdit.js
import React, { useContext, useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const ProfileEdit = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);
    const [newTag, setNewTag] = useState('');
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

    const handleAddTag = async () => {
        // Validate tag format (starts with # and alphanumeric)
        if (!newTag.startsWith('#')) {
            setNewTag('#' + newTag);
        }

        const tagRegex = /^#[a-zA-Z0-9]+$/;
        if (!tagRegex.test(newTag)) {
            toast.error('Tags must start with # and contain only letters and numbers.');
            return;
        }

        try {
            setLoadingTags(true);
            await axios.post('/api/profile/tags', { tagName: newTag });
            // Refresh profile to get updated tags
            const response = await axios.get('/api/profile/me');
            setProfile(response.data);
            setNewTag('');
            toast.success('Tag added successfully!');
        } catch (error) {
            toast.error('Failed to add tag. Please try again.');
            console.error('Error adding tag:', error);
        } finally {
            setLoadingTags(false);
        }
    };

    const handleRemoveTag = async (tagId) => {
        try {
            setLoadingTags(true);
            await axios.delete(`/api/profile/tags/${tagId}`);
            // Refresh profile to get updated tags
            const response = await axios.get('/api/profile/me');
            setProfile(response.data);
            toast.success('Tag removed successfully!');
        } catch (error) {
            toast.error('Failed to remove tag. Please try again.');
            console.error('Error removing tag:', error);
        } finally {
            setLoadingTags(false);
        }
    };

    const handleGetLocation = (setFieldValue) => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFieldValue('latitude', position.coords.latitude);
                setFieldValue('longitude', position.coords.longitude);

                // Optional: Get location name using reverse geocoding
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
                    .then(response => response.json())
                    .then(data => {
                        const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown location';
                        setFieldValue('lastLocation', locationName);
                    })
                    .catch(error => {
                        console.error('Error getting location name:', error);
                        setFieldValue('lastLocation', 'Location detected');
                    });
            },
            (error) => {
                console.error('Error getting location:', error);
                toast.error('Unable to retrieve your location. Please enter it manually.');
            }
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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
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
                                                Gender
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
                                                Sexual Preference
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
                                                Birth Date
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

                                        <div className="mb-4">
                                            <label htmlFor="lastLocation" className="block text-gray-700 font-medium mb-2">
                                                Location Name
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

                                        <button
                                            type="button"
                                            onClick={() => handleGetLocation(setFieldValue)}
                                            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
                                        >
                                            Get Current Location
                                        </button>
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
                                            placeholder="Tell us about yourself..."
                                        />
                                        <ErrorMessage name="bio" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/profile')}
                                        className="mr-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || savingProfile}
                                        className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                    >
                                        {savingProfile ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            {/* Interests/Tags Section */}
            <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Interests</h2>
                </div>

                <div className="p-8">
                    <div className="mb-6">
                        <label htmlFor="newTag" className="block text-gray-700 font-medium mb-2">
                            Add Interest Tag
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                id="newTag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="#fitness"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                disabled={loadingTags || !newTag.trim()}
                                className="bg-indigo-600 text-white py-2 px-4 rounded-r-md hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-300"
                            >
                                {loadingTags ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            Tags must start with # and contain only letters and numbers (e.g., #fitness, #travel).
                        </p>
                    </div>

                    <div>
                        <h3 className="text-md font-medium text-gray-700 mb-3">Your Tags</h3>
                        {profile.tags && profile.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map(tag => (
                                    <div
                                        key={tag.tag_id}
                                        className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                                    >
                                        <span>{tag.tag_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag.tag_id)}
                                            className="ml-2 text-indigo-500 hover:text-indigo-700 focus:outline-none"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No tags added yet. Add some interests to help match with similar users.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Photo Management Section - This will be added in the next step */}
        </div>
    );
};

export default ProfileEdit;