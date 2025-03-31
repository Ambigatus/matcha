const User = require('./User');
const ProfilePicture = require('./ProfilePicture');
const Interest = require('./Interest');

// Setup associations
User.hasMany(ProfilePicture, {
    foreignKey: 'userId',
    as: 'profilePictures'
});
ProfilePicture.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasMany(Interest, {
    foreignKey: 'userId',
    as: 'interests'
});
Interest.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

module.exports = {
    User,
    ProfilePicture,
    Interest
};