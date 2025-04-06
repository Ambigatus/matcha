// frontend/src/pages/browse/ViewProfile.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const ViewProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [isMatch, setIsMatch] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);

            // Get profile data
            const profileResponse = await axios.get(`/api/browse/profile/${userId}`);
            setProfile(profileResponse.data);

            // Check if user is liked by current user
            const likesResponse = await axios.get('/api/interactions/likes');
            const likedUsers = likesResponse.data.given.map(user => user.user_id);
            setLiked(likedUsers.includes(parseInt(userId)));

            // Check if there's a match
            const matchesResponse = await axios.get('/api/interactions/matches');
            const matches = matchesResponse.data;
            const match = matches.find(m => m.other_user_id === parseInt(userId));
            setIsMatch(!!match);

            // Check if user is blocked
            const blockedResponse = await axios.get('/api/interactions/blocks');
            const blockedUsers = blockedResponse.data.map(user => user.user_id);
            setBlocked(blockedUsers.includes(parseInt(userId)));
        } catch (error) {
            toast.error('Failed to load profile. Please try again.');
            console.error('Error fetching profile:', error);
            navigate('/browse');
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;

        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    const handleLike = async () => {
        try {
            setActionLoading(true);
            const response = await axios.post(`/api/interactions/like/${userId}`);
            setLiked(true);

            if (response.data.isMatch) {
                setIsMatch(true);
                toast.success(`It's a match! You can now start chatting.`);
            } else {
                toast.success(`You liked ${profile.firstName}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to like user. Please try again.');
            }
            console.error('Error liking user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlike = async () => {
        try {
            setActionLoading(true);
            await axios.delete(`/api/interactions/like/${userId}`);
            setLiked(false);
            setIsMatch(false);
            toast.info(`You unliked ${profile.firstName}`);
        } catch (error) {
            toast.error('Failed to unlike user. Please try again.');
            console.error('Error unliking user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!window.confirm(`Are you sure you want to block ${profile.firstName}? They will no longer appear in your searches and you won't be able to chat with them.`)) {
            return;
        }

        try {
            setActionLoading(true);
            await axios.post(`/api/interactions/block/${userId}`);
            setBlocked(true);
            setLiked(false);
            setIsMatch(false);
            toast.success(`You blocked ${profile.firstName}`);
        } catch (error) {
            toast.error('Failed to block user. Please try again.');
            console.error('Error blocking user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnblock = async () => {
        try {
            setActionLoading(true);
            await axios.delete(`/api/interactions/block/${userId}`);
            setBlocked(false);
            toast.success(`You unblocked ${profile.firstName}`);
        } catch (error) {
            toast.error('Failed to unblock user. Please try again.');
            console.error('Error unblocking user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReport = async () => {
        const reason = window.prompt(`Please provide a reason for reporting ${profile.firstName}:`);

        if (!reason) return;

        try {
            setActionLoading(true);
            await axios.post(`/api/interactions/report/${userId}`, { reason });
            toast.success(`You reported ${profile.firstName}`);
        } catch (error) {
            toast.error('Failed to report user. Please try again.');
            console.error('Error reporting user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const getLastActiveText = (lastActive) => {
        if (!lastActive) return 'Never logged in';

        const lastActiveDate = new Date(lastActive);
        const now = new Date();
        const diffSeconds = Math.floor((now - lastActiveDate) / 1000);

        if (diffSeconds < 60) return 'Just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;

        return lastActiveDate.toLocaleDateString(undefined, {
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

    if (!profile) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h2>
                <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
                <Link to="/browse" className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700">
                    Back to Browse
                </Link>
            </div>
        );
    }

    const age = calculateAge(profile.profile.birthDate);
    const profilePicture = profile.photos && profile.photos.find(photo => photo.isProfile);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Profile Header */}
                <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-full">
                            {profilePicture ? (
                                <img
                                    src={`http://localhost:5000/${profilePicture.path}`}
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

                    {/* Online status */}
                    <div className="absolute top-4 right-4">
                        {profile.isOnline ? (
                            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center">
                                <span className="h-2 w-2 bg-white rounded-full mr-1"></span>
                                Online
                            </span>
                        ) : (
                            <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full">
                                Last seen {getLastActiveText(profile.lastActive)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Profile Info */}
                <div className="pt-16 px-8 pb-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {profile.firstName} {profile.lastName}
                            {age && <span className="ml-2 text-xl text-gray-600">{age}</span>}
                        </h1>
                        <p className="text-indigo-600">@{profile.username}</p>
                        <div className="flex justify-center items-center mt-2">
                            {profile.distance && (
                                <div className="flex items-center text-gray-600 mr-4">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{profile.distance} km away</span>
                                </div>
                            )}
                            <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                                <span>Fame Rating: {profile.profile.fameRating || 0}/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4 mb-8">
                        {blocked ? (
                            <button
                                onClick={handleUnblock}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Unblock User
                            </button>
                        ) : (
                            <>
                                {isMatch ? (
                                    <Link
                                        to={`/chat/${profile.matchId || ''}`}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Send Message
                                    </Link>
                                ) : null}

                                {liked ? (
                                    <button
                                        onClick={handleUnlike}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200 flex items-center disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        Unlike
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLike}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-pink-100 text-pink-600 rounded-md hover:bg-pink-200 transition-colors duration-200 flex items-center disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        Like
                                    </button>
                                )}

                                <button
                                    onClick={handleBlock}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Block
                                </button>

                                <button
                                    onClick={handleReport}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Report
                                </button>
                            </>
                        )}
                    </div>

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">About Me</h2>
                            <p className="text-gray-600">
                                {profile.profile.bio || 'No biography provided.'}
                            </p>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Details</h2>
                            <ul className="space-y-2">
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Gender:</span>
                                    <span className="text-gray-600 capitalize">{profile.profile.gender || 'Not specified'}</span>
                                </li>
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Interested in:</span>
                                    <span className="text-gray-600 capitalize">
                                        {profile.profile.sexualPreference === 'heterosexual'
                                            ? (profile.profile.gender === 'male' ? 'Women' : 'Men')
                                            : profile.profile.sexualPreference === 'homosexual'
                                                ? (profile.profile.gender === 'male' ? 'Men' : 'Women')
                                                : 'Men and Women'}
                                    </span>
                                </li>
                                <li className="flex">
                                    <span className="font-medium text-gray-700 w-32">Location:</span>
                                    <span className="text-gray-600">
                                        {profile.profile.location || 'Not specified'}
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
                                {profile.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            profile.commonTags && profile.commonTags.includes(tag)
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {tag}
                                        {profile.commonTags && profile.commonTags.includes(tag) && (
                                            <span className="ml-1 text-indigo-500" title="Common interest">•</span>
                                        )}
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
                                {profile.photos.map((photo, index) => (
                                    <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={`http://localhost:5000/${photo.path}`}
                                            alt={`${profile.firstName}'s gallery`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No additional photos.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfile;