// backend/src/controllers/browseController.js
const { User, Profile, Photo, Tag, UserTag, Like, Match } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const geolib = require('geolib');

/**
 * Get profile suggestions based on user preferences and matching criteria
 */
exports.getSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user profile with preferences and tags in a single query
        const userProfile = await Profile.findOne({
            where: { user_id: userId },
            include: [{
                model: User,
                as: 'user',
                include: [{
                    model: Tag,
                    as: 'tags',
                    through: { attributes: [] }
                }]
            }]
        });

        if (!userProfile) {
            return res.status(400).json({ message: 'Please complete your profile first' });
        }

        // Extract user's tag IDs for compatibility matching
        const userTagIds = userProfile.user.tags.map(tag => tag.tag_id);

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
                // No need to filter by gender
            }
        }

        // Get blocked users to exclude them from results
        const blockedUsers = await sequelize.query(`
            SELECT blocked_id FROM blocked_users WHERE blocker_id = :userId
            UNION
            SELECT blocker_id FROM blocked_users WHERE blocked_id = :userId
        `, {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
        });

        const blockedUserIds = blockedUsers.map(u => u.blocked_id || u.blocker_id);
        if (blockedUserIds.length > 0) {
            whereConditions.user_id = {
                ...whereConditions.user_id,
                [Op.notIn]: blockedUserIds
            };
        }

        // Get matching profiles with eager loading to reduce queries
        const profiles = await Profile.findAll({
            where: whereConditions,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
                    include: [{
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }]
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false
                }
            ]
        });

        // Get all likes at once to determine if user has liked profiles
        const userLikes = await Like.findAll({
            where: { liker_id: userId },
            attributes: ['liked_id']
        });
        const likedUserIds = userLikes.map(like => like.liked_id);

        // Get all matches at once
        const userMatches = await Match.findAll({
            where: {
                [Op.or]: [
                    { user1_id: userId },
                    { user2_id: userId }
                ]
            },
            attributes: ['match_id', 'user1_id', 'user2_id']
        });

        // Map of other user IDs to match IDs
        const matchMap = userMatches.reduce((map, match) => {
            const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
            map[otherUserId] = match.match_id;
            return map;
        }, {});

        // Calculate match scores and format the response
        const suggestions = profiles.map(profile => {
            // Get the profile's tags
            const profileTags = profile.user.tags || [];
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

            // Get profile picture
            const profilePicture = profile.photos.find(photo => photo.is_profile);

            // Check if user has liked this profile
            const isLiked = likedUserIds.includes(profile.user_id);

            // Check if there's a match
            const isMatch = !!matchMap[profile.user_id];
            const matchId = matchMap[profile.user_id];

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
                tags: profileTags.map(tag => tag.tag_name),
                photos: profile.photos.map(photo => ({
                    photoId: photo.photo_id,
                    filePath: photo.file_path,
                    isProfile: photo.is_profile
                })),
                profilePicture: profilePicture ? profilePicture.file_path : null,
                isLiked,
                isMatch,
                matchId,
                // Calculate compatibility score (weighted sum of fame rating, common tags, and inverse distance)
                compatibilityScore: (
                    (profile.fame_rating / 100) * 0.2 + // 20% weight for fame rating
                    (commonTags / Math.max(userTagIds.length, 1)) * 0.5 + // 50% weight for common tags
                    (distance !== null ? (1 - Math.min(distance, 100) / 100) * 0.3 : 0) // 30% weight for proximity
                )
            };
        });

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

        // Get the profile with all associated data in one query
        const profile = await Profile.findOne({
            where: { user_id: profileId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
                    include: [{
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }]
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false
                }
            ]
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Check if profiles are a match or have liked each other
        const [likeStatus, matchStatus] = await Promise.all([
            // Check if viewer has liked profile
            Like.findOne({
                where: { liker_id: viewerId, liked_id: profileId }
            }),
            // Check if there's a match
            Match.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: viewerId, user2_id: profileId },
                        { user1_id: profileId, user2_id: viewerId }
                    ]
                }
            })
        ]);

        // Record a profile view and create notification in one transaction
        await sequelize.transaction(async (t) => {
            // Increment view count
            await Profile.increment('views_count', {
                where: { user_id: profileId },
                transaction: t
            });

            // Create view notification
            await sequelize.query(`
                INSERT INTO notifications (user_id, type, from_user_id, is_read, created_at)
                VALUES (:userId, 'profile_view', :viewerId, false, NOW())
            `, {
                replacements: { userId: profileId, viewerId },
                transaction: t
            });
        });

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
            photos: profile.photos.map(photo => ({
                photoId: photo.photo_id,
                filePath: photo.file_path,
                isProfile: photo.is_profile
            })),
            tags: profile.user.tags.map(tag => ({
                tagId: tag.tag_id,
                tagName: tag.tag_name
            })),
            isLiked: !!likeStatus,
            isMatch: !!matchStatus,
            matchId: matchStatus ? matchStatus.match_id : null
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
            tags: tagIds,
            sortBy = 'compatibility',
            sortDirection = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // Get user profile with tags in a single query
        const userProfile = await Profile.findOne({
            where: { user_id: userId },
            include: [{
                model: User,
                as: 'user',
                include: [{
                    model: Tag,
                    as: 'tags',
                    through: { attributes: [] }
                }]
            }]
        });

        if (!userProfile) {
            return res.status(400).json({ message: 'Please complete your profile first' });
        }

        const userTagIds = userProfile.user.tags.map(tag => tag.tag_id);

        // Build the WHERE conditions for the query
        let whereConditions = {
            user_id: { [Op.ne]: userId } // Exclude current user
        };

        // Apply sexual preference matching (similar to getSuggestions)
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

        // Get all blocked users to exclude them from results
        const blockedUsers = await sequelize.query(`
            SELECT blocked_id FROM blocked_users WHERE blocker_id = :userId
            UNION
            SELECT blocker_id FROM blocked_users WHERE blocked_id = :userId
        `, {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
        });

        const blockedUserIds = blockedUsers.map(u => u.blocked_id || u.blocker_id);
        if (blockedUserIds.length > 0) {
            whereConditions.user_id = {
                ...whereConditions.user_id,
                [Op.notIn]: blockedUserIds
            };
        }

        // Get profiles matching the criteria with eager loading
        const profiles = await Profile.findAll({
            where: whereConditions,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'first_name', 'last_name', 'is_online', 'last_login'],
                    include: [{
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }]
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false
                }
            ]
        });

        // Get user likes to determine if user has liked profiles
        const userLikes = await Like.findAll({
            where: { liker_id: userId },
            attributes: ['liked_id']
        });
        const likedUserIds = userLikes.map(like => like.liked_id);

        // Process search results
        let searchResults = [];

        // Process and add tags filter if needed
        const tagsToFilter = tagIds
            ? (Array.isArray(tagIds) ? tagIds : tagIds.split(',').map(tag => parseInt(tag)))
            : [];

        for (const profile of profiles) {
            // Get profile's tag IDs
            const profileTags = profile.user.tags || [];
            const profileTagIds = profileTags.map(tag => tag.tag_id);

            // Filter by tags if needed
            if (tagsToFilter.length > 0) {
                // Check if profile has ALL specified tags
                const hasAllTags = tagsToFilter.every(tagId =>
                    profileTagIds.includes(parseInt(tagId))
                );

                if (!hasAllTags) {
                    continue; // Skip this profile
                }
            }

            // Calculate common tags
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

            // Get profile picture
            const profilePicture = profile.photos.find(photo => photo.is_profile);

            // Check if user has liked this profile
            const isLiked = likedUserIds.includes(profile.user_id);

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
                tags: profileTags.map(tag => ({
                    tagId: tag.tag_id,
                    tagName: tag.tag_name
                })),
                photos: profile.photos.map(photo => ({
                    photoId: photo.photo_id,
                    filePath: photo.file_path,
                    isProfile: photo.is_profile
                })),
                profilePicture: profilePicture ? profilePicture.file_path : null,
                isLiked,
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