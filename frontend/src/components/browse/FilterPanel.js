// frontend/src/components/browse/FilterPanel.js
import React, { useState } from 'react';

const FilterPanel = ({ filters, onFilterChange, sorting, onSortChange, onSearch }) => {
    const [isOpen, setIsOpen] = useState(false); // For mobile toggling
    const [localFilters, setLocalFilters] = useState({ ...filters });
    const [newTag, setNewTag] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        if (!newTag.trim()) return;

        // Format tag to start with #
        let formattedTag = newTag.trim();
        if (!formattedTag.startsWith('#')) {
            formattedTag = '#' + formattedTag;
        }

        // Check if tag already exists
        if (!localFilters.tags.includes(formattedTag)) {
            setLocalFilters(prev => ({
                ...prev,
                tags: [...prev.tags, formattedTag]
            }));
        }

        setNewTag('');
    };

    const removeTag = (tagToRemove) => {
        setLocalFilters(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSortChange = (e) => {
        const { name, value } = e.target;
        const newSorting = { ...sorting, [name]: value };
        onSortChange(newSorting);
    };

    const applyFilters = () => {
        onFilterChange(localFilters);
        onSearch();
    };

    const resetFilters = () => {
        const emptyFilters = {
            ageMin: '',
            ageMax: '',
            fameMin: '',
            fameMax: '',
            location: '',
            distance: '',
            tags: []
        };

        setLocalFilters(emptyFilters);
        onFilterChange(emptyFilters);
        onSearch();
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>

                {/* Mobile toggle */}
                <button
                    className="md:hidden text-gray-500 hover:text-gray-700"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    )}
                </button>
            </div>

            <div className={`px-6 py-4 ${isOpen ? 'block' : 'hidden md:block'}`}>
                {/* Age Range */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="number"
                                name="ageMin"
                                value={localFilters.ageMin}
                                onChange={handleInputChange}
                                placeholder="Min"
                                min="18"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                name="ageMax"
                                value={localFilters.ageMax}
                                onChange={handleInputChange}
                                placeholder="Max"
                                min="18"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Fame Rating */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fame Rating
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="number"
                                name="fameMin"
                                value={localFilters.fameMin}
                                onChange={handleInputChange}
                                placeholder="Min"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                name="fameMax"
                                value={localFilters.fameMax}
                                onChange={handleInputChange}
                                placeholder="Max"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <input
                        type="text"
                        name="location"
                        value={localFilters.location}
                        onChange={handleInputChange}
                        placeholder="City, Region, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Distance */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Distance (km)
                    </label>
                    <input
                        type="number"
                        name="distance"
                        value={localFilters.distance}
                        onChange={handleInputChange}
                        placeholder="Distance in km"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Tags */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Tags
                    </label>
                    <div className="flex">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="#fitness"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-r-md hover:bg-gray-300"
                        >
                            Add
                        </button>
                    </div>

                    {localFilters.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {localFilters.tags.map((tag, index) => (
                                <div key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center">
                                    <span>{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sorting */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <select
                            name="sortBy"
                            value={sorting.sortBy}
                            onChange={handleSortChange}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="distance">Distance</option>
                            <option value="age">Age</option>
                            <option value="fame">Fame Rating</option>
                            <option value="tags">Common Tags</option>
                            <option value="compatibility">Match Score</option>
                        </select>

                        <select
                            name="sortDirection"
                            value={sorting.sortDirection}
                            onChange={handleSortChange}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Apply Filters
                    </button>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;