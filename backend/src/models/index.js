const User = require('./User');
const Profile = require('./Profile');
const Photo = require('./Photo');
const { Tag, UserTag } = require('./Tag');
const Like = require('./Like');
const Match = require('./Match');
const Notification = require('./Notification');

// User and Profile
User.hasOne(Profile, {
    foreignKey: 'user_id',
    as: 'profile'
});
Profile.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// User and Photos
User.hasMany(Photo, {
    foreignKey: 'user_id',
    as: 'photos'
});
Photo.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// Profile and Photos
Profile.hasMany(Photo, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
    as: 'photos'
});
Photo.belongsTo(Profile, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'profile'
});

// User and Tags (many-to-many)
User.belongsToMany(Tag, {
    through: UserTag,
    foreignKey: 'user_id',
    otherKey: 'tag_id',
    as: 'tags'
});
Tag.belongsToMany(User, {
    through: UserTag,
    foreignKey: 'tag_id',
    otherKey: 'user_id',
    as: 'users'
});

// User and Likes (as liker)
User.hasMany(Like, {
    foreignKey: 'liker_id',
    as: 'likes_given'
});
Like.belongsTo(User, {
    foreignKey: 'liker_id',
    as: 'liker'
});

// User and Likes (as liked)
User.hasMany(Like, {
    foreignKey: 'liked_id',
    as: 'likes_received'
});
Like.belongsTo(User, {
    foreignKey: 'liked_id',
    as: 'liked'
});

// User and Matches (as user1)
User.hasMany(Match, {
    foreignKey: 'user1_id',
    as: 'matches_as_user1'
});
Match.belongsTo(User, {
    foreignKey: 'user1_id',
    as: 'user1'
});

// User and Matches (as user2)
User.hasMany(Match, {
    foreignKey: 'user2_id',
    as: 'matches_as_user2'
});
Match.belongsTo(User, {
    foreignKey: 'user2_id',
    as: 'user2'
});

// User and Notifications
User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'notifications'
});
Notification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// Export all models
module.exports = {
    User,
    Profile,
    Photo,
    Tag,
    UserTag,
    Like,
    Match,
    Notification
};