const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

class User extends Model {
    // Method to validate password
    async validatePassword(password) {
        return bcrypt.compare(password, this.password);
    }

    // Method to generate public profile (excluding sensitive info)
    toPublicProfile() {
        const { id, username, email, firstName, lastName, profileCompleted } = this;
        return { id, username, firstName, lastName, profileCompleted };
    }
}

User.init({
    // Basic Authentication Fields
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
        allowNull: false,
        validate: {
            len: [8, 255] // Minimum password length
        }
    },

    // Personal Information
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    // Profile Completion and Verification
    profileCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    // Dating Profile Fields
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },
    sexualPreference: {
        type: DataTypes.ENUM('heterosexual', 'homosexual', 'bisexual'),
        defaultValue: 'bisexual'
    },
    biography: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Location and Tracking
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Fame Rating
    fameRating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
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

// Associated Models (to be created later)
User.associate = (models) => {
    User.hasMany(models.ProfilePicture, {
        foreignKey: 'userId',
        as: 'profilePictures'
    });
    User.hasMany(models.Interest, {
        foreignKey: 'userId',
        as: 'interests'
    });
};

module.exports = User;
