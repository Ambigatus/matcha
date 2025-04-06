// frontend/src/pages/browse/Browse.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Browse = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch suggestions when the component mounts
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/browse/suggestions');
                setSuggestions(response.data);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                setError('Failed to load suggestions. Please try again.');
                toast.error('Failed to load suggestions');
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    // Handle like/unlike user
    const handleLikeUser = async (userId) => {
        try {
            await axios.post(`/api/likes/${userId}`);
            toast.success('User liked successfully!');

            // Update the suggestions list to reflect the like
            setSuggestions(prevSuggestions =>
                prevSuggestions.map(suggestion =>
                    suggestion.userId === userId
                        ? { ...suggestion, isLiked: true }
                        : suggestion
                )
            );
        } catch (error) {
            console.error('Error liking user:', error);
            toast.error(error.response?.data?.message || 'Failed to like user');
        }
    };

    // Calculate age from birth date
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

    // Format distance
    const formatDistance = (distance) => {
        if (distance === null) return 'Unknown';
        if (distance < 1) return `${Math.round(distance * 1000)} m`;
        return `${Math.round(distance)} km`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Matches</h1>

            {suggestions.length === 0 ? (
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No matches found</h2>
                    <p className="text-gray-600">
                        Complete your profile and add more information to get better matches.
                    </p>
                    <Link
                        to="/profile/edit"
                        className="mt-4 inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                    >
                        Update Profile
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.map(user => (
                        <div key={user.userId} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* User Photo */}
                            <div className="aspect-w-1 aspect-h-1">
                                {user.profilePicture ? (
                                    <img
                                        src={`/${user.profilePicture}`}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <span className="text-4xl font-bold text-gray-400">
                                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        <p className="text-gray-600">@{user.username}</p>
                                    </div>
                                    <div className="flex items-center">
                                        {user.isOnline ? (
                                            <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-1"></span>
                                        ) : (
                                            <span className="inline-block h-3 w-3 bg-gray-300 rounded-full mr-1"></span>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            {user.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Age:</span>{' '}
                                        <span className="font-medium">{calculateAge(user.birthDate)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Location:</span>{' '}
                                        <span className="font-medium">{user.location || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Distance:</span>{' '}
                                        <span className="font-medium">{formatDistance(user.distance)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Fame:</span>{' '}
                                        <span className="font-medium">{user.fameRating?.toFixed(0) || 0}/100</span>
                                    </div>
                                </div>

                                {user.commonTagsCount > 0 && (
                                    <div className="mt-3">
                                        <span className="text-gray-600 text-sm">
                                            {user.commonTagsCount} common interest{user.commonTagsCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-between">
                                    <Link
                                        to={`/browse/profile/${user.userId}`}
                                        className="bg-indigo-100 text-indigo-700 py-2 px-4 rounded hover:bg-indigo-200 transition-colors"
                                    >
                                        View Profile
                                    </Link>
                                    <button
                                        onClick={() => handleLikeUser(user.userId)}
                                        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                                    >
                                        {user.isLiked ? 'Liked' : 'Like'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Browse;