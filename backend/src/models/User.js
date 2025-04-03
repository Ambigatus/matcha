// backend/src/models/User.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

class User extends Model {
    // Method to validate password
    async validatePassword(password) {
        return bcrypt.compare(password, this.password);
    }

    // Method to generate public profile (excluding sensitive info)
    toPublicJSON() {
        const { user_id, username, email, first_name, last_name, is_verified, is_online, last_login } = this;
        return {
            id: user_id,
            username,
            email,
            firstName: first_name,
            lastName: last_name,
            isVerified: is_verified,
            isOnline: is_online,
            lastLogin: last_login
        };
    }
}

User.init({
    // Basic Authentication Fields
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50],
            isAlphanumeric: true
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    // Profile Completion and Verification
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Status Fields
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Timestamps
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        // Hash password before creating or updating
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

module.exports = User;