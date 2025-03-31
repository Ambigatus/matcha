const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create more verbose Sequelize connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: (msg) => {
        // Only log in development, not in production
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DB LOG]: ${msg}`);
        }
    },
    pool: {
        max: 5,      // Maximum number of connection in pool
        min: 0,      // Minimum number of connection in pool
        acquire: 30000, // Maximum time to acquire a connection
        idle: 10000  // Connection can be idle before being released
    },

    // Additional connection options for more robust connection
    dialectOptions: {
        // If you're on a system that requires SSL
        // ssl: {
        //   require: true,
        //   rejectUnauthorized: false
        // }
    }
});

// Comprehensive database initialization
const initializeDatabase = async () => {
    try {
        // Test the connection
        await sequelize.authenticate();
        console.log('✅ Database Connection: Successful');
        console.log(`📍 Connected to: ${sequelize.config.database}`);
        console.log(`🔐 Connection User: ${sequelize.config.username}`);

        // Synchronize models
        await sequelize.sync({
            force: false,  // Prevent dropping existing tables
            alter: true    // Safely alter table structure if models change
        });
        console.log('🗄️ Database Models: Synchronized Successfully');

    } catch (error) {
        console.error('❌ Database Initialization Failed:', error);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    initializeDatabase
};