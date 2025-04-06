// backend/src/controllers/browseController.js
const { User, Profile, Photo, Tag, UserTag } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const geolib = require('geolib'); // You'll need to install this package for distance calculations

/**
 * Get profile suggestions based on user preferences and matching criteria
 */
exports.getSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user profile with preferences
        const userProfile = await Profile.findOne({
            where: { user_id: userId }
        });

        if (!userProfile) {
            return res.status(400).json({ message: 'Please complete your profile first' });
        }

        // Get user's tags for compatibility matching
        const userTags = await UserTag.findAll({
            where: { user_id: userId },
            attributes: ['tag_id']
        });

        const userTagIds = userTags.map(tag => tag.tag_id);

        // Build the base query conditions
        let whereConditions = {
            user_id: { [Op.ne]: userId } // Exclude the current user
        };

        // Match based on sexual preferences
        if (userProfile.gender && userProfile.sexual_preference) {
            // For heterosexual users
            if (userProfile.sexual_preference === 'heterosexual') {
                // If user is male, looking for female
                if (userProfile.gender === 'male') {
                    whereConditions.gender = 'female';
                    whereConditions.sexual_preference = { [Op.in]: ['heterosexual', 'bisexual'] };
                }
                // If user is female, looking for male
                else if (userProfile.gender === 'female') {
                    whereConditions.gender = 'male';
                    whereConditions.sexual_preference = { [Op.in]: ['heterosexual', 'bisexual'] };
                }
            }
            // For homosexual users
            else if (userProfile.sexual_preference === 'homosexual') {
                // If user is male, looking for male
                if (userProfile.gender === 'male') {
                    whereConditions.gender = 'male';
                    whereConditions.sexual_preference = { [Op.in]: ['homosexual', 'bisexual'] };
                }
                // If user is female, looking for female
                else if (userProfile.gender === 'female') {
                    whereConditions.gender = 'female';
                    whereConditions.sexual_preference = { [Op.in]: ['homosexual', 'bisexual'] };
                }
            }
            // For bisexual users - no gender restrictions, but match preference
            else if (userProfile.sexual_preference === 'bisexual') {
                // Match with users who would be interested in this user's gender
                if (userProfile.gender === 'male') {
                    whereConditions.sexual_preference = { [Op.in]: ['homosexual', 'bisexual'] };
                } else if (userProfile.gender === 'female') {
                    whereConditions.sexual_preference = { [Op.in]: ['heterosexual', 'bisexual'] };
                }
            }
        }

        // Get profiles that match the criteria
        const profiles = await Profile.findAll({
            where: whereConditions,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login']
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false,
                    attributes: ['photo_id', 'file_path', 'is_profile']
                }
            ]
        });

        // Calculate compatibility scores and add additional data
        const suggestions = await Promise.all(profiles.map(async (profile) => {
            // Get the tags for this profile
            const profileTags = await UserTag.findAll({
                where: { user_id: profile.user_id },
                include: [
                    {
                        model: Tag,
                        as: 'tag',
                        attributes: ['tag_id', 'tag_name']
                    }
                ]
            });

            const profileTagIds = profileTags.map(tag => tag.tag_id);

            // Calculate the number of common tags
            const commonTags = userTagIds.filter(tagId =>
                profileTagIds.includes(tagId)
            ).length;

            // Calculate geographic distance if both users have coordinates
            let distance = null;
            if (userProfile.latitude && userProfile.longitude &&
                profile.latitude && profile.longitude) {

                distance = geolib.getDistance(
                    { latitude: userProfile.latitude, longitude: userProfile.longitude },
                    { latitude: profile.latitude, longitude: profile.longitude }
                ) / 1000; // Convert meters to kilometers
            }

            // Build the suggestion object with all required data
            return {
                userId: profile.user_id,
                username: profile.user.username,
                firstName: profile.user.first_name,
                lastName: profile.user.last_name,
                gender: profile.gender,
                sexualPreference: profile.sexual_preference,
                bio: profile.bio,
                birthDate: profile.birth_date,
                location: profile.last_location,
                distance: distance,
                fameRating: profile.fame_rating,
                isOnline: profile.user.is_online,
                lastActive: profile.last_active,
                lastLogin: profile.user.last_login,
                commonTagsCount: commonTags,
                photos: profile.photos,
                profilePicture: profile.photos.find(photo => photo.is_profile)?.file_path || null,
                // Calculate compatibility score (weighted sum of fame rating, common tags, and inverse distance)
                compatibilityScore: (
                    (profile.fame_rating / 100) * 0.2 + // 20% weight for fame rating
                    (commonTags / Math.max(userTagIds.length, 1)) * 0.5 + // 50% weight for common tags
                    (distance !== null ? (1 - Math.min(distance, 100) / 100) * 0.3 : 0) // 30% weight for proximity
                )
            };
        }));

        // Sort the suggestions by compatibility score (descending)
        suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ message: 'Server error fetching suggestions' });
    }
};

/**
 * Get profile details by ID
 */
exports.getProfile = async (req, res) => {
    try {
        const { profileId } = req.params;
        const viewerId = req.user.id;

        // Don't allow viewing your own profile through this endpoint
        if (profileId == viewerId) {
            return res.status(400).json({ message: 'Please use the profile endpoint to view your own profile' });
        }

        // Get the profile with associated data
        const profile = await Profile.findOne({
            where: { user_id: profileId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login']
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false,
                    attributes: ['photo_id', 'file_path', 'is_profile']
                }
            ]
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Get tags for this profile
        const tags = await UserTag.findAll({
            where: { user_id: profileId },
            include: [
                {
                    model: Tag,
                    as: 'tag',
                    attributes: ['tag_id', 'tag_name']
                }
            ]
        });

        // Record a profile view
        await Profile.increment('views_count', { where: { user_id: profileId } });

        // Add to view history (this would be a separate table)
        // To be implemented: ProfileView model

        // Compile the response
        const profileData = {
            userId: profile.user_id,
            username: profile.user.username,
            firstName: profile.user.first_name,
            lastName: profile.user.last_name,
            gender: profile.gender,
            sexualPreference: profile.sexual_preference,
            bio: profile.bio,
            birthDate: profile.birth_date,
            location: profile.last_location,
            fameRating: profile.fame_rating,
            isOnline: profile.user.is_online,
            lastActive: profile.last_active,
            lastLogin: profile.user.last_login,
            photos: profile.photos,
            tags: tags.map(t => ({
                tagId: t.tag.tag_id,
                tagName: t.tag.tag_name
            }))
        };

        res.status(200).json(profileData);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

/**
 * Search users with various filters
 */
exports.searchUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            ageMin,
            ageMax,
            fameMin,
            fameMax,
            location,
            tags,
            sortBy = 'compatibility',
            sortDirection = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // Get user profile
        const userProfile = await Profile.findOne({
            where: { user_id: userId }
        });

        if (!userProfile) {
            return res.status(400).json({ message: 'Please complete your profile first' });
        }

        // Get user's tags
        const userTags = await UserTag.findAll({
            where: { user_id: userId },
            attributes: ['tag_id']
        });

        const userTagIds = userTags.map(tag => tag.tag_id);

        // Build the WHERE conditions for the query
        let whereConditions = {
            user_id: { [Op.ne]: userId } // Exclude current user
        };

        // Match based on sexual preferences (same logic as in getSuggestions)
        if (userProfile.gender && userProfile.sexual_preference) {
            // For heterosexual users
            if (userProfile.sexual_preference === 'heterosexual') {
                // If user is male, looking for female
                if (userProfile.gender === 'male') {
                    whereConditions.gender = 'female';
                    whereConditions.sexual_preference = { [Op.in]: ['heterosexual', 'bisexual'] };
                }
                // If user is female, looking for male
                else if (userProfile.gender === 'female') {
                    whereConditions.gender = 'male';
                    whereConditions.sexual_preference = { [Op.in]: ['heterosexual', 'bisexual'] };
                }
            }
            // For homosexual users
            else if (userProfile.sexual_preference === 'homosexual') {
                // If user is male, looking for male
                if (userProfile.gender === 'male') {
                    whereConditions.gender = 'male';
                    whereConditions.sexual_preference = { [Op.in]: ['homosexual', 'bisexual'] };
                }
                // If user is female, looking for female
                else if (userProfile.gender === 'female') {
                    whereConditions.gender = 'female';
                    whereConditions.sexual_preference = { [Op.in]: ['homosexual', 'bisexual'] };
                }
            }
            // For bisexual users - no gender restrictions
        }

        // Apply age filter if provided
        if (ageMin || ageMax) {
            const today = new Date();

            if (ageMin) {
                const maxBirthDate = new Date(today);
                maxBirthDate.setFullYear(today.getFullYear() - parseInt(ageMin));
                whereConditions.birth_date = {
                    ...(whereConditions.birth_date || {}),
                    [Op.lte]: maxBirthDate
                };
            }

            if (ageMax) {
                const minBirthDate = new Date(today);
                minBirthDate.setFullYear(today.getFullYear() - parseInt(ageMax));
                whereConditions.birth_date = {
                    ...(whereConditions.birth_date || {}),
                    [Op.gte]: minBirthDate
                };
            }
        }

        // Apply fame rating filter if provided
        if (fameMin) {
            whereConditions.fame_rating = {
                ...(whereConditions.fame_rating || {}),
                [Op.gte]: parseFloat(fameMin)
            };
        }

        if (fameMax) {
            whereConditions.fame_rating = {
                ...(whereConditions.fame_rating || {}),
                [Op.lte]: parseFloat(fameMax)
            };
        }

        // Apply location filter if provided
        if (location) {
            whereConditions.last_location = { [Op.iLike]: `%${location}%` };
        }

        // Get profiles matching the criteria
        const profiles = await Profile.findAll({
            where: whereConditions,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login']
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false,
                    attributes: ['photo_id', 'file_path', 'is_profile']
                }
            ]
        });

        // Process search results
        let searchResults = [];

        // Process and add tags filter if needed
        const tagsToFilter = tags ? tags.split(',').map(tag => parseInt(tag)) : [];

        for (const profile of profiles) {
            // Get profile tags
            const profileTags = await UserTag.findAll({
                where: { user_id: profile.user_id },
                include: [
                    {
                        model: Tag,
                        as: 'tag',
                        attributes: ['tag_id', 'tag_name']
                    }
                ]
            });

            const profileTagIds = profileTags.map(tag => tag.tag_id);

            // Filter by tags if needed
            if (tagsToFilter.length > 0) {
                // Check if profile has ALL specified tags
                const hasAllTags = tagsToFilter.every(tagId =>
                    profileTagIds.includes(tagId)
                );

                if (!hasAllTags) {
                    continue; // Skip this profile
                }
            }

            // Calculate the number of common tags
            const commonTags = userTagIds.filter(tagId =>
                profileTagIds.includes(tagId)
            ).length;

            // Calculate geographic distance if coordinates available
            let distance = null;
            if (userProfile.latitude && userProfile.longitude &&
                profile.latitude && profile.longitude) {

                distance = geolib.getDistance(
                    { latitude: userProfile.latitude, longitude: userProfile.longitude },
                    { latitude: profile.latitude, longitude: profile.longitude }
                ) / 1000; // Convert meters to kilometers
            }

            // Add the profile to search results
            searchResults.push({
                userId: profile.user_id,
                username: profile.user.username,
                firstName: profile.user.first_name,
                lastName: profile.user.last_name,
                gender: profile.gender,
                bio: profile.bio,
                birthDate: profile.birth_date,
                location: profile.last_location,
                distance: distance,
                fameRating: profile.fame_rating,
                isOnline: profile.user.is_online,
                lastActive: profile.last_active,
                lastLogin: profile.user.last_login,
                commonTagsCount: commonTags,
                tags: profileTags.map(t => ({
                    tagId: t.tag.tag_id,
                    tagName: t.tag.tag_name
                })),
                photos: profile.photos,
                profilePicture: profile.photos.find(photo => photo.is_profile)?.file_path || null,
                compatibilityScore: (
                    (profile.fame_rating / 100) * 0.2 + // 20% weight for fame rating
                    (commonTags / Math.max(userTagIds.length, 1)) * 0.5 + // 50% weight for common tags
                    (distance !== null ? (1 - Math.min(distance, 100) / 100) * 0.3 : 0) // 30% weight for proximity
                )
            });
        }

        // Sort results
        switch (sortBy) {
            case 'age':
                searchResults.sort((a, b) => {
                    if (!a.birthDate) return sortDirection === 'asc' ? 1 : -1;
                    if (!b.birthDate) return sortDirection === 'asc' ? -1 : 1;
                    return sortDirection === 'asc'
                        ? new Date(a.birthDate) - new Date(b.birthDate)
                        : new Date(b.birthDate) - new Date(a.birthDate);
                });
                break;

            case 'distance':
                searchResults.sort((a, b) => {
                    if (a.distance === null) return sortDirection === 'asc' ? 1 : -1;
                    if (b.distance === null) return sortDirection === 'asc' ? -1 : 1;
                    return sortDirection === 'asc'
                        ? a.distance - b.distance
                        : b.distance - a.distance;
                });
                break;

            case 'fame':
                searchResults.sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.fameRating - b.fameRating
                        : b.fameRating - a.fameRating
                );
                break;

            case 'tags':
                searchResults.sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.commonTagsCount - b.commonTagsCount
                        : b.commonTagsCount - a.commonTagsCount
                );
                break;

            case 'compatibility':
            default:
                searchResults.sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.compatibilityScore - b.compatibilityScore
                        : b.compatibilityScore - a.compatibilityScore
                );
                break;
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = searchResults.slice(startIndex, endIndex);

        res.status(200).json({
            results: paginatedResults,
            pagination: {
                total: searchResults.length,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(searchResults.length / limit)
            }
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error searching users' });
    }
};