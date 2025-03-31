const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Interest extends Model {}

Interest.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    tag: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            // Ensure tag starts with # and is alphanumeric
            is: /^#[a-zA-Z0-9]+$/
        }
    }
}, {
    sequelize,
    modelName: 'Interest',
    tableName: 'interests'
});
