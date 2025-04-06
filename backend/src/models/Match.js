// backend/src/models/Match.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Match extends Model {}

Match.init({
    match_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user1_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    user2_id: {
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
    modelName: 'Match',
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['user1_id', 'user2_id']
        }
    ]
});

module.exports = Match;