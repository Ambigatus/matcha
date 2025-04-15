// frontend/src/pages/matches/Matches.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Matches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                // Use the correct endpoint for getting matches
                const response = await axios.get('/api/interactions/matches');
                console.log('Matches response:', response.data);
                setMatches(response.data);
            } catch (error) {
                console.error('Error fetching matches:', error);
                setError('Failed to load matches. Please try again.');
                toast.error('Failed to load matches');
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

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

    // Format date
    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
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
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Matches</h1>

            {matches.length === 0 ? (
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No matches yet</h2>
                    <p className="text-gray-600 mb-4">
                        You haven't matched with anyone yet. Start browsing profiles and liking people who interest you!
                    </p>
                    <Link
                        to="/browse"
                        className="inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                    >
                        Browse Profiles
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                            You have {matches.length} match{matches.length !== 1 ? 'es' : ''}
                        </h2>
                    </div>

                    <ul className="divide-y divide-gray-200">
                        {matches.map((match) => (
                            <li key={match.matchId} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 relative">
                                        {match.profilePicture ? (
                                            <img
                                                src={`/${match.profilePicture}`}
                                                alt={`${match.firstName} ${match.lastName}`}
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-lg font-medium text-gray-500">
                                                    {match.firstName?.charAt(0)}{match.lastName?.charAt(0)}
                                                </span>
                                            </div>
                                        )}

                                        {match.isOnline && (
                                            <span className="absolute -mt-2 ml-8 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {match.firstName} {match.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {match.gender && `${match.gender}, `}{calculateAge(match.birthDate)} • {match.location || 'Unknown location'}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">
                                            Matched: {formatDate(match.matchedAt)}
                                        </span>

                                        <Link
                                            to={`/chat/${match.matchId}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                        >
                                            Chat
                                        </Link>

                                        <Link
                                            to={`/browse/profile/${match.userId}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                        >
                                            Profile
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Matches;