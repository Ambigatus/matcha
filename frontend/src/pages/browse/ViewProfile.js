// frontend/src/pages/browse/ProfileView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ViewProfile = () => {
    const { profileId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/browse/profile/${profileId}`);
                setProfile(response.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError('Failed to load profile. Please try again.');
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [profileId]);

    const handleLikeUser = async () => {
        try {
            setLiking(true);
            const response = await axios.post(`/api/likes/${profileId}`);

            setProfile(prev => ({
                ...prev,
                isLiked: true
            }));

            // Check if it's a match
            if (response.data.isMatch) {
                toast.success('It\'s a match! You can now chat with this user.');
            } else {
                toast.success('User liked successfully!');
            }
        } catch (error) {
            console.error('Error liking user:', error);
            toast.error(error.response?.data?.message || 'Failed to like user');
        } finally {
            setLiking(false);
        }
    };

    const handleUnlikeUser = async () => {
        try {
            setLiking(true);
            await axios.delete(`/api/likes/${profileId}`);

            setProfile(prev => ({
                ...prev,
                isLiked: false,
                isMatch: false
            }));

            toast.success('User unliked successfully');
        } catch (error) {
            console.error('Error unliking user:', error);
            toast.error(error.response?.data?.message || 'Failed to unlike user');
        } finally {
            setLiking(false);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'Unknown';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>{error || 'Failed to load profile'}</p>
                <button
                    onClick={() => navigate('/browse')}
                    className="mt-2 bg-indigo-500 text-white py-1 px-3 rounded hover:bg-indigo-600 transition-colors"
                >
                    Back to Browse
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/browse')}
                className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Browse
            </button>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Profile Header */}
                <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                    {/* Profile Actions */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                        {profile.isLiked ? (
                            <button
                                onClick={handleUnlikeUser}
                                disabled={liking}
                                className="bg-red-500 text-white py-2 px-4 rounded-full shadow hover:bg-red-600 transition-colors"
                            >
                                Unlike
                            </button>
                        ) : (
                            <button
                                onClick={handleLikeUser}
                                disabled={liking}
                                className="bg-indigo-600 text-white py-2 px-4 rounded-full shadow hover:bg-indigo-700 transition-colors"
                            >
                                Like
                            </button>
                        )}

                        {profile.isMatch && (
                            <button
                                onClick={() => navigate(`/chat/${profile.matchId}`)}
                                className="bg-green-500 text-white py-2 px-4 rounded-full shadow hover:bg-green-600 transition-colors"
                            >
                                Chat
                            </button>
                        )}
                    </div>

                    {/* Profile Picture */}
                    <div className="absolute inset-x-0 -bottom-16 flex justify-center">
                        <div className="bg-white p-1 rounded-full">
                            {profile.profilePicture ? (
                                <img
                                    src={`/${profile.profilePicture}`}
                                    alt={`${profile.firstName} ${profile.lastName}`}
                                    className="h-32 w-32 object-cover rounded-full"
                                />
                            ) : (
                                <div className="h-32 w-32 flex items-center justify-center bg-gray-200 rounded-full">
                                    <span className="text-3xl font-bold text-gray-400">
                                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="pt-20 px-8 pb-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        <p className="text-indigo-600">@{profile.username}</p>
                        <div className="flex justify-center items-center mt-2">
                            <div className="flex items-center text-gray-600 mr-4">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span>{profile.location || 'Location not set'}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                                <span>Fame Rating: {profile.fameRating?.toFixed(0) || 0}/100</span>
                            </div>
                        </div>
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
                                    <span className="font-medium text-gray-700 w-32">Age:</span>
                                    <span className="text-gray-600">{calculateAge(profile.birthDate)}</span>
                                </li>
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Gender:</span>
                                    <span className="text-gray-600">{profile.gender || 'Not specified'}</span>
                                </li>
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Status:</span>
                                    <span className="text-gray-600">
                                        {profile.isOnline ? (
                                            <span className="flex items-center">
                                                <span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-2"></span>
                                                Online
                                            </span>
                                        ) : (
                                            <span>Last active: {formatDate(profile.lastLogin || profile.lastActive)}</span>
                                        )}
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
                                        key={tag.tagId}
                                        className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                                    >
                                        {tag.tagName}
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {profile.photos.map(photo => (
                                    <div key={photo.photoId} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={`/${photo.filePath}`}
                                            alt="Gallery"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No additional photos available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfile;