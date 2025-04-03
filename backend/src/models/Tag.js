// backend/src/models/Tag.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Tag extends Model {}

Tag.init({
    tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tag_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            is: /^#[a-zA-Z0-9]+$/
        }
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
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// User Tags (junction table)
class UserTag extends Model {}

UserTag.init({
    user_tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'UserTag',
    tableName: 'user_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = { Tag, UserTag };