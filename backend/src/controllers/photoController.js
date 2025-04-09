// backend/src/controllers/photoController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const { Photo } = require('../models');
const {sequelize} = require("../utils/db");

// Convert callbacks to promises
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);

// Validate file type properly
const validateFileType = (file) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return true;
    } else {
        return false;
    }
};

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            // Create a unique subfolder for each user
            const userUploadDir = `uploads/users/${req.user.id}`;

            // Create directory recursively if it doesn't exist
            await mkdirAsync(userUploadDir, { recursive: true });

            cb(null, userUploadDir);
        } catch (error) {
            console.error('Error creating upload directory:', error);
            cb(new Error('Failed to create upload directory'));
        }
    },
    filename: (req, file, cb) => {
        // Generate a random filename to prevent overwriting and path traversal
        const randomName = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${extension}`);
    }
});

// Configure multer upload
const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) // 5MB default limit
    },
    fileFilter: (req, file, cb) => {
        // Validate filetype
        if (!validateFileType(file)) {
            return cb(new Error('Only JPEG, PNG and GIF image files are allowed'), false);
        }

        cb(null, true);
    }
});

// Handle file upload with proper error handling
exports.uploadPhoto = (req, res, next) => {
    // Use single file upload
    const uploadMiddleware = upload.single('photo');

    uploadMiddleware(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred during upload
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        message: `File too large. Maximum size is ${Math.floor(parseInt(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) / (1024 * 1024))}MB`
                    });
                }
                return res.status(400).json({ message: err.message });
            }

            // For other errors
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        try {
            // Verify file actually exists on disk
            await statAsync(req.file.path);

            // Continue to controller logic
            next();
        } catch (error) {
            console.error('Error verifying uploaded file:', error);
            return res.status(500).json({ message: 'Error processing uploaded file' });
        }
    });
};

// Controller method to save photo record
exports.savePhoto = async (req, res) => {
    try {
        // Check if user already has 5 photos
        const photoCount = await Photo.count({
            where: { user_id: req.user.id }
        });

        if (photoCount >= 5) {
            // Delete the uploaded file
            await unlinkAsync(req.file.path);
            return res.status(400).json({ message: 'Maximum of 5 photos allowed' });
        }

        // For the file path, store the relative path from the uploads directory
        const filePath = req.file.path;

        // Save photo record in database
        const isFirstPhoto = photoCount === 0;
        const photo = await Photo.create({
            user_id: req.user.id,
            file_path: filePath,
            is_profile: isFirstPhoto
        });

        res.status(201).json({
            message: 'Photo uploaded successfully',
            photo: {
                id: photo.photo_id,
                path: filePath,
                isProfile: isFirstPhoto
            }
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        // Delete the uploaded file if database operation fails
        if (req.file) {
            try {
                await unlinkAsync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file after failed upload:', unlinkError);
            }
        }
        res.status(500).json({ message: 'Server error uploading photo' });
    }
};

// Set profile photo
exports.setProfilePhoto = async (req, res) => {
    const { photoId } = req.params;

    try {
        // Check if photo exists and belongs to user
        const photo = await Photo.findOne({
            where: {
                photo_id: photoId,
                user_id: req.user.id
            }
        });

        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Using a transaction to ensure atomicity
        await sequelize.transaction(async (t) => {
            // Reset all photos to non-profile
            await Photo.update(
                { is_profile: false },
                {
                    where: { user_id: req.user.id },
                    transaction: t
                }
            );

            // Set the selected photo as profile
            await Photo.update(
                { is_profile: true },
                {
                    where: { photo_id: photoId },
                    transaction: t
                }
            );
        });

        res.status(200).json({
            message: 'Profile photo updated successfully',
            photo: {
                id: photo.photo_id,
                path: photo.file_path,
                isProfile: true
            }
        });
    } catch (error) {
        console.error('Set profile photo error:', error);
        res.status(500).json({ message: 'Server error setting profile photo' });
    }
};

// Delete photo
exports.deletePhoto = async (req, res) => {
    const { photoId } = req.params;

    try {
        // Get photo details
        const photo = await Photo.findOne({
            where: {
                photo_id: photoId,
                user_id: req.user.id
            }
        });

        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        const isProfilePhoto = photo.is_profile;
        const filePath = photo.file_path;

        // Using a transaction to ensure atomicity
        await sequelize.transaction(async (t) => {
            // Delete photo from database
            await photo.destroy({ transaction: t });

            // If this was a profile photo, set another photo as profile if available
            if (isProfilePhoto) {
                const remainingPhoto = await Photo.findOne({
                    where: { user_id: req.user.id },
                    transaction: t
                });

                if (remainingPhoto) {
                    await remainingPhoto.update(
                        { is_profile: true },
                        { transaction: t }
                    );
                }
            }
        });

        // Delete file from filesystem
        await unlinkAsync(filePath);

        res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ message: 'Server error deleting photo' });
    }
};