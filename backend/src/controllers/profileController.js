// backend/src/controllers/profileController.js
const { User, Profile, Photo, Tag, UserTag } = require('../models');
const { sequelize } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get user's own profile
exports.getMyProfile = async (req, res) => {
    try {
        // Get profile data with associated data
        const user = await User.findByPk(req.user.id, {
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    attributes: { exclude: ['user_id'] }
                },
                {
                    model: Photo,
                    as: 'photos',
                    attributes: ['photo_id', 'file_path', 'is_profile']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag_id', 'tag_name'],
                    through: { attributes: [] } // Exclude junction table attributes
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Compile complete profile
        const profile = {
            ...user.profile.get({ plain: true }),
            tags: user.tags,
            photos: user.photos
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
        // Find or create profile
        const [profile] = await Profile.findOrCreate({
            where: { user_id: req.user.id },
            defaults: { user_id: req.user.id }
        });

        // Update profile
        await profile.update({
            gender,
            sexual_preference: sexualPreference,
            bio,
            birth_date: birthDate,
            latitude,
            longitude,
            last_location: lastLocation,
            last_active: new Date()
        });

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
        const [tag, created] = await Tag.findOrCreate({
            where: { tag_name: tagName },
            defaults: { tag_name: tagName }
        });

        // Check if user already has this tag
        const existingUserTag = await UserTag.findOne({
            where: {
                user_id: req.user.id,
                tag_id: tag.tag_id
            }
        });

        if (existingUserTag) {
            return res.status(400).json({ message: 'Tag already added to your profile' });
        }

        // Add tag to user
        await UserTag.create({
            user_id: req.user.id,
            tag_id: tag.tag_id
        });

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
        await UserTag.destroy({
            where: {
                user_id: req.user.id,
                tag_id: tagId
            }
        });

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
            const photoCount = await Photo.count({
                where: { user_id: req.user.id }
            });

            if (photoCount >= 5) {
                // Delete the uploaded file since we can't use it
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'Maximum of 5 photos allowed' });
            }

            // Save photo record in database
            const isFirstPhoto = photoCount === 0;
            const photo = await Photo.create({
                user_id: req.user.id,
                file_path: req.file.path,
                is_profile: isFirstPhoto
            });

            res.status(201).json({
                message: 'Photo uploaded successfully',
                photo: {
                    id: photo.photo_id,
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
        fs.unlinkSync(filePath);

        res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ message: 'Server error deleting photo' });
    }
};