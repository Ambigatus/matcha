// backend/src/models/Profile.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Profile extends Model {}

Profile.init({
    profile_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    gender: {
        type: DataTypes.STRING,  // Changed from ENUM to STRING for easier migration
        allowNull: true,
        validate: {
            isIn: [['male', 'female', 'other']]
        }
    },
    sexual_preference: {
        type: DataTypes.STRING,  // Changed from ENUM to STRING for easier migration
        allowNull: true,
        defaultValue: 'bisexual',
        validate: {
            isIn: [['heterosexual', 'homosexual', 'bisexual']]
        }
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    birth_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    last_location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    last_active: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fame_rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    likes_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    matches_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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
    modelName: 'Profile',
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Profile;