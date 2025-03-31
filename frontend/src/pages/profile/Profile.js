// frontend/src/pages/profile/Profile.js
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Display placeholder if profile isn't complete
    if (!profile || !profile.gender) {
        return (
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile</h2>
                    <p className="text-gray-600 mb-6">
                        Your profile is not yet complete. Please fill in your details to start matching with other users.
                    </p>
                    <Link
                        to="/profile/edit"
                        className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                    >
                        Complete Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Profile Header */}
                <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-1 rounded-full">
                            {profile.photos && profile.photos.length > 0 ? (
                                <img
                                    src={`/${profile.photos.find(photo => photo.is_profile).file_path}`}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="h-32 w-32 object-cover rounded-full"
                                />
                            ) : (
                                <div className="h-32 w-32 flex items-center justify-center bg-gray-200 rounded-full">
                                  <span className="text-3xl font-bold text-gray-400">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="pt-16 px-8 pb-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-indigo-600">@{user.username}</p>
                        <div className="flex justify-center items-center mt-2">
                            <div className="flex items-center text-gray-600 mr-4">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span>{profile.last_location || 'Location not set'}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                                <span>Fame Rating: {profile.fame_rating || 0}/100</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mb-6">
                        <Link
                            to="/profile/edit"
                            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                        >
                            Edit Profile
                        </Link>
                    </div>

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">About Me</h2>
                            <p className="text-gray-600">
                                {profile.bio || 'No biography provided yet.'}
                            </p>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Details</h2>
                            <ul className="space-y-2">
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Gender:</span>
                                    <span className="text-gray-600">{profile.gender || 'Not specified'}</span>
                                </li>
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Preference:</span>
                                    <span className="text-gray-600">{profile.sexual_preference || 'Not specified'}</span>
                                </li>
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Birth Date:</span>
                                    <span className="text-gray-600">
                                    {profile.birth_date
                                        ? new Date(profile.birth_date).toLocaleDateString()
                                        : 'Not specified'
                                    }
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Interests */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Interests</h2>
                        {profile.tags && profile.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map(tag => (
                                    <span
                                        key={tag.tag_id}
                                        className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                                    >
                                    {tag.tag_name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No interests added yet.</p>
                        )}
                    </div>

                    {/* Photos */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Photos</h2>
                        {profile.photos && profile.photos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {profile.photos.map(photo => (
                                    <div key={photo.photo_id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={`/${photo.file_path}`}
                                            alt="User gallery"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No photos added yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Stats Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Profile Views</h3>
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-indigo-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-2xl font-bold text-gray-700">{profile.views_count || 0}</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Likes Received</h3>
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-indigo-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="text-2xl font-bold text-gray-700">{profile.likes_count || 0}</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Matches</h3>
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-indigo-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-2xl font-bold text-gray-700">{profile.matches_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;