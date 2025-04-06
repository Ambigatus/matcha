// backend/src/models/Like.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Like extends Model {}

Like.init({
    like_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    liker_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    liked_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['liker_id', 'liked_id']
        }
    ]
});

module.exports = Like;