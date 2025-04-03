// backend/src/models/index.js
const User = require('./User');
const Profile = require('./Profile');
const Photo = require('./Photo');
const { Tag, UserTag } = require('./Tag');

// Setup associations
User.hasOne(Profile, {
    foreignKey: 'user_id',
    as: 'profile'
});
Profile.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

User.hasMany(Photo, {
    foreignKey: 'user_id',
    as: 'photos'
});
Photo.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

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

// For backwards compatibility with legacy code
const models = {
    User,
    Profile,
    Photo,
    Tag,
    UserTag
};

module.exports = models;