// frontend/src/components/profile/TagsInput.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const TagsInput = ({ userId, initialTags = [] }) => {
    const [tags, setTags] = useState(initialTags);
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);

    const formatTagInput = (input) => {
        // Make sure the tag starts with #
        if (!input.startsWith('#')) {
            input = '#' + input;
        }

        // Remove spaces and special characters, lowercase
        return input.replace(/[^a-zA-Z0-9#]/g, '').toLowerCase();
    };

    const handleInputChange = (e) => {
        let value = e.target.value;
        // Format on input
        if (value.length > 0 && !value.startsWith('#')) {
            value = '#' + value;
        }
        setNewTag(value);
    };

    const handleAddTag = async () => {
        if (!newTag || newTag === '#') {
            return;
        }

        const formattedTag = formatTagInput(newTag);

        // Check if tag already exists
        if (tags.some(tag => tag.tag_name.toLowerCase() === formattedTag.toLowerCase())) {
            toast.info('This tag already exists in your profile');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/api/profile/tags', {
                tagName: formattedTag
            });

            // Refresh tags from server
            const profileResponse = await axios.get('/api/profile/me');
            setTags(profileResponse.data.tags || []);

            setNewTag('');
            toast.success('Tag added successfully');
        } catch (error) {
            toast.error('Failed to add tag: ' + (error.response?.data?.message || 'Unknown error'));
            console.error('Error adding tag:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTag = async (tagId) => {
        try {
            setLoading(true);
            await axios.delete(`/api/profile/tags/${tagId}`);

            // Update local state
            setTags(tags.filter(tag => tag.tag_id !== tagId));
            toast.success('Tag removed successfully');
        } catch (error) {
            toast.error('Failed to remove tag');
            console.error('Error removing tag:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !loading) {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <div>
            <p className="text-gray-600 mb-4">
                Add tags to show your interests. This helps us find better matches for you.
            </p>

            <div className="mb-6">
                <label htmlFor="newTag" className="block text-gray-700 font-medium mb-2">
                    Add Interest Tag
                </label>
                <div className="flex">
                    <input
                        type="text"
                        id="newTag"
                        value={newTag}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="#fitness"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={handleAddTag}
                        disabled={loading || !newTag || newTag === '#'}
                        className="bg-indigo-600 text-white py-2 px-4 rounded-r-md hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding...' : 'Add'}
                    </button>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                    Examples: #fitness, #travel, #music, #gaming
                </p>
            </div>

            <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Your Tags</h3>
                {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <div
                                key={tag.tag_id}
                                className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                            >
                                <span>{tag.tag_name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag.tag_id)}
                                    disabled={loading}
                                    className="ml-2 text-indigo-500 hover:text-indigo-700 focus:outline-none disabled:text-indigo-300 disabled:cursor-not-allowed"
                                    title="Remove tag"
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
    );
};

export default TagsInput;