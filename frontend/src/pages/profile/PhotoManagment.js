// frontend/src/pages/profile/PhotoManagement.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PhotoManagement = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/profile/me');
            setPhotos(response.data.photos || []);
        } catch (error) {
            toast.error('Failed to load photos. Please try again.');
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, or GIF)');
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        setSelectedFile(file);

        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }

        // Check if already at maximum photos (5)
        if (photos.length >= 5) {
            toast.error('You can only have a maximum of 5 photos. Please delete one before uploading.');
            return;
        }

        const formData = new FormData();
        formData.append('photo', selectedFile);

        try {
            setUploading(true);
            await axios.post('/api/profile/photos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Reset form state
            setSelectedFile(null);
            setPreviewUrl(null);

            // Refresh photos
            await fetchPhotos();
            toast.success('Photo uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload photo. Please try again.');
            console.error('Error uploading photo:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSetProfilePhoto = async (photoId) => {
        try {
            await axios.put(`/api/profile/photos/${photoId}/set-profile`);
            await fetchPhotos();
            toast.success('Profile photo updated!');
        } catch (error) {
            toast.error('Failed to set profile photo. Please try again.');
            console.error('Error setting profile photo:', error);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        try {
            await axios.delete(`/api/profile/photos/${photoId}`);
            await fetchPhotos();
            toast.success('Photo deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete photo. Please try again.');
            console.error('Error deleting photo:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Photos</h2>
                <p className="text-gray-600 text-sm mt-1">
                    You can upload up to 5 photos and choose one as your profile picture.
                </p>
            </div>

            <div className="p-8">
                {/* Photo Upload Section */}
                <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-700 mb-3">Upload New Photo</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept="image/jpeg,image/png,image/gif"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                        (!selectedFile || uploading) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Photo'}
                                </button>
                            </div>
                        </div>

                        {previewUrl && (
                            <div>
                                <h3 className="text-md font-medium text-gray-700 mb-3">Preview</h3>
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Photo Gallery Section */}
                <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Your Photos</h3>

                    {photos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {photos.map(photo => (
                                <div key={photo.photo_id} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={`/${photo.file_path}`}
                                            alt="User gallery"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSetProfilePhoto(photo.photo_id)}
                                                className={`p-1 rounded-full ${
                                                    photo.is_profile ? 'bg-green-500 text-white' : 'bg-white text-indigo-600'
                                                }`}
                                                title={photo.is_profile ? 'Current profile photo' : 'Set as profile photo'}
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeletePhoto(photo.photo_id)}
                                                className="p-1 rounded-full bg-white text-red-600"
                                                title="Delete photo"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {photo.is_profile && (
                                        <div className="absolute top-2 right-2">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Profile
                      </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No photos uploaded yet. Add photos to increase your visibility.</p>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                        <p>Photos help others get to know you better. You can upload up to {5 - photos.length} more photos.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoManagement;