// frontend/src/pages/browse/Browse.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FilterPanel from '../../components/browse/FilterPanel';

const Browse = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Default filter and sort values
    const [filters, setFilters] = useState({
        ageMin: '',
        ageMax: '',
        fameMin: '',
        fameMax: '',
        location: '',
        distance: '',
        tags: []
    });

    const [sorting, setSorting] = useState({
        sortBy: 'compatibility',
        sortDirection: 'desc'
    });

    const cardRef = useRef(null);

    // Fetch suggestions when the component mounts
    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/browse/suggestions');
            setSuggestions(response.data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setError('Failed to load suggestions. Please try again.');
            toast.error('Failed to load suggestions');
        } finally {
            setLoading(false);
        }
    };

    const applySearch = async () => {
        try {
            setLoading(true);

            // Construct query parameters from filters
            const params = new URLSearchParams();

            if (filters.ageMin) params.append('ageMin', filters.ageMin);
            if (filters.ageMax) params.append('ageMax', filters.ageMax);
            if (filters.fameMin) params.append('fameMin', filters.fameMin);
            if (filters.fameMax) params.append('fameMax', filters.fameMax);
            if (filters.location) params.append('location', filters.location);
            if (filters.distance) params.append('distance', filters.distance);
            if (filters.tags.length > 0) {
                // Format tags as required by the API
                filters.tags.forEach(tag => {
                    params.append('tags', tag.replace('#', ''));
                });
            }

            // Add sorting parameters
            params.append('sortBy', sorting.sortBy);
            params.append('sortDirection', sorting.sortDirection);

            const response = await axios.get(`/api/browse/search?${params.toString()}`);

            if (response.data.results && response.data.results.length > 0) {
                setSuggestions(response.data.results);
                setCurrentIndex(0);
                setShowFilters(false);
                toast.success(`Found ${response.data.results.length} matches`);
            } else {
                setSuggestions([]);
                toast.info('No profiles match your search criteria. Try broadening your filters.');
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Error searching profiles');
        } finally {
            setLoading(false);
        }
    };

// Handle like/unlike user with animation
    const handleLikeUser = async (liked = true) => {
        if (loading || isAnimating || suggestions.length === 0 || currentIndex >= suggestions.length) {
            return;
        }

        const userId = suggestions[currentIndex].userId;

        // Start swipe animation
        setIsAnimating(true);
        if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.5s ease';
            cardRef.current.style.transform = `translateX(${liked ? '150%' : '-150%'}) rotate(${liked ? '30deg' : '-30deg'})`;
        }

        try {
            if (liked) {
                // Use the correct API endpoint
                const response = await axios.post(`/api/interactions/like/${userId}`);

                if (response.data.isMatch) {
                    toast.success(`It's a match with ${suggestions[currentIndex].firstName}! Check your matches.`);
                } else {
                    toast.success(`You liked ${suggestions[currentIndex].firstName}`);
                }
            } else {
                // Skip this profile (no API call needed)
                // You could implement a "pass" endpoint if you want to track passes
            }

            // Wait for animation to complete before updating state
            setTimeout(() => {
                setCurrentIndex(prevIndex => {
                    // If this was the last card, show a message and fetch more
                    if (prevIndex >= suggestions.length - 1) {
                        toast.info("You've seen all profiles for now. Try again later!");
                        fetchSuggestions(); // Optionally refresh the list
                        return 0;
                    }
                    return prevIndex + 1;
                });

                // Reset card position
                if (cardRef.current) {
                    cardRef.current.style.transition = 'none';
                    cardRef.current.style.transform = 'translateX(0) rotate(0)';
                }

                setIsAnimating(false);
            }, 300);

        } catch (error) {
            console.error('Error handling like/pass:', error);
            toast.error(error.response?.data?.message || 'Failed to process your action');

            // Reset animation and state in case of error
            if (cardRef.current) {
                cardRef.current.style.transition = 'transform 0.3s ease';
                cardRef.current.style.transform = 'translateX(0) rotate(0)';
            }
            setIsAnimating(false);
        }
    };

    // Calculate age from birth date
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

    // Format distance
    const formatDistance = (distance) => {
        if (distance === null) return 'Unknown';
        if (distance < 1) return `${Math.round(distance * 1000)} m`;
        return `${Math.round(distance)} km`;
    };

    if (loading && suggestions.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error && suggestions.length === 0) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
                <p>{error}</p>
                <button
                    onClick={() => fetchSuggestions()}
                    className="mt-2 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const showEmptyState = suggestions.length === 0;
    const currentProfile = !showEmptyState && currentIndex < suggestions.length ? suggestions[currentIndex] : null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Discover</h1>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                </button>
            </div>

            {showFilters && (
                <FilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    sorting={sorting}
                    onSortChange={setSorting}
                    onSearch={applySearch}
                />
            )}

            {showEmptyState ? (
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No matches found</h2>
                    <p className="text-gray-600">
                        Complete your profile and try different search criteria to find more matches.
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/profile/edit"
                            className="inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                        >
                            Update Profile
                        </Link>
                        <button
                            onClick={fetchSuggestions}
                            className="inline-block bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                        >
                            Show All Profiles
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative mt-8">
                    {/* Profile Card */}
                    <div
                        ref={cardRef}
                        className="max-w-xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden"
                    >
                        {/* Profile Image */}
                        <div className="relative">
                            <div className="aspect-w-4 aspect-h-5 bg-gray-200">
                                {currentProfile.profilePicture ? (
                                    <img
                                        src={`/${currentProfile.profilePicture}`}
                                        alt={`${currentProfile.firstName}'s profile`}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gray-200">
                                        <span className="text-4xl font-bold text-gray-400">
                                            {currentProfile.firstName?.charAt(0)}{currentProfile.lastName?.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Online status */}
                            <div className="absolute top-4 right-4 px-3 py-1 bg-gray-900 bg-opacity-50 text-white rounded-full">
                                {currentProfile.isOnline ? (
                                    <div className="flex items-center">
                                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                        <span>Online</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span className="h-2 w-2 bg-gray-400 rounded-full mr-2"></span>
                                        <span>Offline</span>
                                    </div>
                                )}
                            </div>

                            {/* Name and basic info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
                                <h2 className="text-2xl font-bold">
                                    {currentProfile.firstName} {currentProfile.lastName.charAt(0)}.
                                    <span className="ml-2">{calculateAge(currentProfile.birthDate)}</span>
                                </h2>
                                <p className="flex items-center text-sm">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {currentProfile.location || 'Unknown location'} • {formatDistance(currentProfile.distance)}
                                </p>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="p-4">
                            {/* Bio */}
                            {currentProfile.bio && (
                                <div className="mb-4">
                                    <h3 className="text-gray-800 font-medium mb-2">About</h3>
                                    <p className="text-gray-600">{currentProfile.bio}</p>
                                </div>
                            )}

                            {/* Tags/Interests */}
                            {currentProfile.tags && currentProfile.tags.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-gray-800 font-medium mb-2">Interests</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {currentProfile.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-around mt-6">
                                <button
                                    onClick={() => handleLikeUser(false)}
                                    disabled={isAnimating}
                                    className="flex items-center justify-center h-14 w-14 bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <Link
                                    to={`/browse/profile/${currentProfile.userId}`}
                                    className="flex items-center justify-center h-14 w-14 bg-blue-100 rounded-full shadow-md hover:bg-blue-200 transition-colors"
                                >
                                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </Link>

                                <button
                                    onClick={() => handleLikeUser(true)}
                                    disabled={isAnimating}
                                    className="flex items-center justify-center h-14 w-14 bg-red-500 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Card counter */}
                            <div className="mt-6 text-center text-gray-500 text-sm">
                                Profile {currentIndex + 1} of {suggestions.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Browse;