// backend/src/models/Photo.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Photo extends Model {}

Photo.init({
    photo_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    is_profile: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Photo',
    tableName: 'photos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Photo;