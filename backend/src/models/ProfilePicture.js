const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ProfilePicture extends Model {}

ProfilePicture.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    isProfilePicture: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'ProfilePicture',
    tableName: 'profile_pictures'
});
