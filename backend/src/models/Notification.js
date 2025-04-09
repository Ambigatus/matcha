// backend/src/models/Notification.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Notification extends Model {}

Notification.init({
    notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['like', 'profile_view', 'match', 'message', 'unmatch']]
        }
    },
    from_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (e.g., message_id for message notifications)'
    },
    is_read: {
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
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        // Index for faster retrieval of user notifications
        {
            fields: ['user_id', 'is_read']
        },
        // Index for notifications from a specific user
        {
            fields: ['from_user_id']
        },
        // Index for sorting by created_at
        {
            fields: ['created_at']
        }
    ]
});

module.exports = Notification;