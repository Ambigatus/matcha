// frontend/src/pages/browse/Browse.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import UserCard from '../../components/browse/UserCard';
import FilterPanel from '../../components/browse/FilterPanel';

const Browse = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
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
        sortBy: 'distance',
        sortDirection: 'asc'
    });

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/browse/suggestions');
            setSuggestions(response.data);
        } catch (error) {
            toast.error('Failed to load suggestions. Please try again.');
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);

            // Build query parameters
            const params = {};
            if (filters.ageMin) params.ageMin = filters.ageMin;
            if (filters.ageMax) params.ageMax = filters.ageMax;
            if (filters.fameMin) params.fameMin = filters.fameMin;
            if (filters.fameMax) params.fameMax = filters.fameMax;
            if (filters.location) params.location = filters.location;
            if (filters.distance) params.distance = filters.distance;
            if (filters.tags.length > 0) params.tags = filters.tags;

            // Add sorting
            params.sortBy = sorting.sortBy;
            params.sortDirection = sorting.sortDirection;

            const response = await axios.get('/api/browse/search', { params });
            setSuggestions(response.data);
        } catch (error) {
            toast.error('Search failed. Please try again.');
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleSortChange = (newSorting) => {
        setSorting(newSorting);

        // Apply new sorting to current results
        const sortedResults = [...suggestions].sort((a, b) => {
            let compareA, compareB;

            switch (newSorting.sortBy) {
                case 'age':
                    const getAge = (birthDate) => {
                        if (!birthDate) return 0;
                        const today = new Date();
                        const birth = new Date(birthDate);
                        let age = today.getFullYear() - birth.getFullYear();
                        const monthDiff = today.getMonth() - birth.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                            age--;
                        }
                        return age;
                    };
                    compareA = getAge(a.profile.birthDate);
                    compareB = getAge(b.profile.birthDate);
                    break;
                case 'distance':
                    compareA = parseFloat(a.distance);
                    compareB = parseFloat(b.distance);
                    break;
                case 'fame':
                    compareA = a.profile.fameRating;
                    compareB = b.profile.fameRating;
                    break;
                case 'commonTags':
                    compareA = a.commonTagCount || 0;
                    compareB = b.commonTagCount || 0;
                    break;
                case 'matchScore':
                    compareA = a.matchScore || 0;
                    compareB = b.matchScore || 0;
                    break;
                default:
                    return 0;
            }

            return newSorting.sortDirection === 'asc' ? compareA - compareB : compareB - compareA;
        });

        setSuggestions(sortedResults);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left sidebar for filters */}
                <div className="w-full md:w-80 lg:w-96">
                    <FilterPanel
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        sorting={sorting}
                        onSortChange={handleSortChange}
                        onSearch={handleSearch}
                    />
                </div>

                {/* Main content area */}
                <div className="flex-1">
                    <div className="mb-6 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {filters.ageMin || filters.ageMax || filters.location || filters.tags.length > 0
                                ? 'Search Results'
                                : 'Suggested Matches'}
                        </h1>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchSuggestions}
                                className="text-indigo-600 hover:text-indigo-800 flex items-center"
                                title="Refresh suggestions"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="ml-1 hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {suggestions.map(user => (
                                <UserCard
                                    key={user.userId}
                                    user={user}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-700 mb-2">No matches found</h3>
                            <p className="text-gray-500 mb-4">
                                {filters.ageMin || filters.ageMax || filters.location || filters.tags.length > 0
                                    ? 'Try broadening your search criteria or try again later.'
                                    : 'Try updating your profile with more information to get better matches.'}
                            </p>
                            <div className="flex justify-center">
                                <Link
                                    to="/profile/edit"
                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Update your profile
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Browse;