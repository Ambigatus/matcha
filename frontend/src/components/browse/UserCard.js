// frontend/src/components/browse/UserCard.js
import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { handleApiError } from '../../utils/errorUtils';

const UserCard = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [liked, setLiked] = useState(user.isLiked || false);
    const [isMatch, setIsMatch] = useState(user.isMatch || false);
    const [matchId, setMatchId] = useState(user.matchId || null);

    // Calculate age once with useMemo
    const age = useMemo(() => {
        if (!user.birthDate) return null;

        const today = new Date();
        const birth = new Date(user.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }, [user.birthDate]);

    // Format distance with useMemo
    const formattedDistance = useMemo(() => {
        if (user.distance === null) return 'Unknown distance';
        if (user.distance < 1) return `${Math.round(user.distance * 1000)} m`;
        return `${Math.round(user.distance)} km`;
    }, [user.distance]);

    // Handle last active text with useMemo
    const lastActiveText = useMemo(() => {
        if (!user.lastActive && !user.lastLogin) return 'Never logged in';

        const lastActiveDate = new Date(user.lastActive || user.lastLogin);
        const now = new Date();
        const diffSeconds = Math.floor((now - lastActiveDate) / 1000);

        if (diffSeconds < 60) return 'Just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;

        return lastActiveDate.toLocaleDateString();
    }, [user.lastActive, user.lastLogin]);

    // Handle like/unlike user with useCallback
    const handleLikeUser = useCallback(async (userId) => {
        if (loading) return;

        try {
            // Use the correct API endpoint
            await axios.post(`/api/interactions/like/${userId}`);
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
    }, [loading]);

    // Handle unlike user with useCallback
    const handleUnlikeUser = useCallback(async () => {
        if (loading) return;

        try {
            setLoading(true);
            await axios.delete(`/api/interactions/like/${user.userId}`);
            setLiked(false);
            setIsMatch(false);
            setMatchId(null);
            toast.info(`You unliked ${user.firstName}`);
        } catch (error) {
            handleApiError(error, 'Failed to unlike user');
        } finally {
            setLoading(false);
        }
    }, [loading, user.userId, user.firstName]);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
                {/* Profile image */}
                <Link to={`/browse/profile/${user.userId}`}>
                    <div className="aspect-w-4 aspect-h-5 bg-gray-200">
                        {user.profilePicture ? (
                            <img
                                src={`/${user.profilePicture}`}
                                alt={`${user.firstName}'s profile`}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-200">
                                <span className="text-4xl font-bold text-gray-400">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Online status */}
                {user.isOnline ? (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1" title="Online">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                ) : (
                    <div
                        className="absolute top-2 right-2 bg-gray-400 rounded-full p-1"
                        title={`Last seen ${lastActiveText}`}
                    >
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                )}

                {/* Match score or common tags indicator */}
                {(user.compatibilityScore || user.commonTagsCount > 0) && (
                    <div className="absolute bottom-2 left-2">
                        {user.compatibilityScore ? (
                            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                                {Math.round(user.compatibilityScore * 100)}% Match
                            </span>
                        ) : user.commonTagsCount > 0 ? (
                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                {user.commonTagsCount} Common {user.commonTagsCount === 1 ? 'Interest' : 'Interests'}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                            {user.firstName} {user.lastName?.charAt(0)}.
                            {age && <span className="ml-2 text-gray-600 text-base">{age}</span>}
                        </h3>
                        <p className="text-gray-600 text-sm">
                            {user.distance ? formattedDistance : user.location || 'Location unknown'}
                        </p>
                    </div>

                    {isMatch ? (
                        <Link
                            to={`/chat/${matchId || ''}`}
                            className="flex items-center justify-center h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                            title="Send a message"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </Link>
                    ) : liked ? (
                        <button
                            onClick={handleUnlikeUser}
                            disabled={loading}
                            className="flex items-center justify-center h-10 w-10 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors disabled:opacity-50"
                            title="Unlike this user"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleLikeUser}
                            disabled={loading}
                            className="flex items-center justify-center h-10 w-10 bg-gray-100 text-gray-600 rounded-full hover:bg-pink-100 hover:text-pink-600 transition-colors disabled:opacity-50"
                            title="Like this user"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Bio preview */}
                {user.bio && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {user.bio}
                    </p>
                )}

                {/* Tags */}
                {user.tags && user.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {user.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className={`text-xs px-2 py-1 rounded-full ${
                                    user.commonTags?.includes(tag)
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {tag}
                            </span>
                        ))}
                        {user.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                +{user.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* View profile link */}
                <div className="mt-4 text-center">
                    <Link
                        to={`/browse/profile/${user.userId}`}
                        className="text-indigo-600 text-sm hover:text-indigo-800 hover:underline"
                    >
                        View Full Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Add React.memo to prevent unnecessary re-renders
export default React.memo(UserCard);