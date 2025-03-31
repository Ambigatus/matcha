// backend/src/controllers/profileController.js
const db = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get user's own profile
exports.getMyProfile = async (req, res) => {
    try {
        // Get profile data
        const profileResult = await db.query(
            'SELECT * FROM profiles WHERE user_id = $1',
            [req.user.id]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Get user's tags
        const tagsResult = await db.query(
            `SELECT t.tag_id, t.tag_name 
       FROM tags t
       JOIN user_tags ut ON t.tag_id = ut.tag_id
       WHERE ut.user_id = $1`,
            [req.user.id]
        );

        // Get user's photos
        const photosResult = await db.query(
            'SELECT photo_id, file_path, is_profile FROM photos WHERE user_id = $1',
            [req.user.id]
        );

        // Compile complete profile
        const profile = {
            ...profileResult.rows[0],
            tags: tagsResult.rows,
            photos: photosResult.rows
        };

        res.status(200).json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error retrieving profile' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    const { gender, sexualPreference, bio, birthDate, latitude, longitude, lastLocation } = req.body;

    try {
        // Update profile
        await db.query(
            `UPDATE profiles 
       SET gender = $1, sexual_preference = $2, bio = $3, birth_date = $4, 
           latitude = $5, longitude = $6, last_location = $7, last_active = NOW()
       WHERE user_id = $8`,
            [gender, sexualPreference, bio, birthDate, latitude, longitude, lastLocation, req.user.id]
        );

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// Add tag to profile
exports.addTag = async (req, res) => {
    const { tagName } = req.body;

    try {
        // Check if tag exists, if not create it
        let tagResult = await db.query(
            'SELECT tag_id FROM tags WHERE tag_name = $1',
            [tagName]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
            // Create new tag
            const newTagResult = await db.query(
                'INSERT INTO tags (tag_name) VALUES ($1) RETURNING tag_id',
                [tagName]
            );
            tagId = newTagResult.rows[0].tag_id;
        } else {
            tagId = tagResult.rows[0].tag_id;
        }

        // Check if user already has this tag
        const userTagResult = await db.query(
            'SELECT * FROM user_tags WHERE user_id = $1 AND tag_id = $2',
            [req.user.id, tagId]
        );

        if (userTagResult.rows.length > 0) {
            return res.status(400).json({ message: 'Tag already added to your profile' });
        }

        // Add tag to user
        await db.query(
            'INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)',
            [req.user.id, tagId]
        );

        res.status(201).json({ message: 'Tag added successfully' });
    } catch (error) {
        console.error('Add tag error:', error);
        res.status(500).json({ message: 'Server error adding tag' });
    }
};

// Remove tag from profile
exports.removeTag = async (req, res) => {
    const { tagId } = req.params;

    try {
        await db.query(
            'DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2',
            [req.user.id, tagId]
        );

        res.status(200).json({ message: 'Tag removed successfully' });
    } catch (error) {
        console.error('Remove tag error:', error);
        res.status(500).json({ message: 'Server error removing tag' });
    }
};

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/profile-photos';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG and GIF image files are allowed'), false);
        }
        cb(null, true);
    }
}).single('photo');

// Upload profile photo
exports.uploadPhoto = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        try {
            // Check if user already has 5 photos
            const photoCount = await db.query(
                'SELECT COUNT(*) FROM photos WHERE user_id = $1',
                [req.user.id]
            );

            if (parseInt(photoCount.rows[0].count) >= 5) {
                // Delete the uploaded file since we can't use it
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'Maximum of 5 photos allowed' });
            }

            // Save photo record in database
            const isFirstPhoto = parseInt(photoCount.rows[0].count) === 0;
            const result = await db.query(
                'INSERT INTO photos (user_id, file_path, is_profile) VALUES ($1, $2, $3) RETURNING photo_id',
                [req.user.id, req.file.path, isFirstPhoto]
            );

            res.status(201).json({
                message: 'Photo uploaded successfully',
                photo: {
                    id: result.rows[0].photo_id,
                    path: req.file.path,
                    isProfile: isFirstPhoto
                }
            });
        } catch (error) {
            console.error('Photo upload error:', error);
            // Delete the uploaded file if database operation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: 'Server error uploading photo' });
        }
    });
};

// Set profile photo
exports.setProfilePhoto = async (req, res) => {
    const { photoId } = req.params;

    try {
        // Check if photo exists and belongs to user
        const photoResult = await db.query(
            'SELECT * FROM photos WHERE photo_id = $1 AND user_id = $2',
            [photoId, req.user.id]
        );

        if (photoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Reset all photos to non-profile
        await db.query(
            'UPDATE photos SET is_profile = FALSE WHERE user_id = $1',
            [req.user.id]
        );

        // Set the selected photo as profile
        await db.query(
            'UPDATE photos SET is_profile = TRUE WHERE photo_id = $1',
            [photoId]
        );

        res.status(200).json({ message: 'Profile photo updated successfully' });
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
        const photoResult = await db.query(
            'SELECT * FROM photos WHERE photo_id = $1 AND user_id = $2',
            [photoId, req.user.id]
        );

        if (photoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        const photo = photoResult.rows[0];
        const isProfilePhoto = photo.is_profile;

        // Delete photo from database
        await db.query(
            'DELETE FROM photos WHERE photo_id = $1',
            [photoId]
        );

        // Delete file from filesystem
        fs.unlinkSync(photo.file_path);

        // If this was a profile photo, set another photo as profile if available
        if (isProfilePhoto) {
            const remainingPhotos = await db.query(
                'SELECT photo_id FROM photos WHERE user_id = $1 LIMIT 1',
                [req.user.id]
            );

            if (remainingPhotos.rows.length > 0) {
                await db.query(
                    'UPDATE photos SET is_profile = TRUE WHERE photo_id = $1',
                    [remainingPhotos.rows[0].photo_id]
                );
            }
        }

        res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ message: 'Server error deleting photo' });
    }
};