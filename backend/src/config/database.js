const { Sequelize } = require('sequelize');
require('dotenv').config();

// Parse DATABASE_URL or use individual connection parameters
let sequelizeConfig = {};
if (process.env.DATABASE_URL) {
    sequelizeConfig = {
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    };
} else {
    // Fallback to individual connection parameters if DATABASE_URL is not provided
    sequelizeConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'matcha',
        dialect: 'postgres'
    };
}

// Create more verbose Sequelize connection
const sequelize = new Sequelize(
    process.env.DATABASE_URL,
    {
        ...sequelizeConfig,
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
        retry: {
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            max: 5 // Maximum number of connection retries
        }
    }
);

// Helper function to test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        return true;
    } catch (error) {
        console.error('Failed to connect to database:', error);
        return false;
    }
};

// Comprehensive database initialization
const initializeDatabase = async () => {
    try {
        // Test the connection
        const connected = await testConnection();

        if (!connected) {
            console.error('❌ Unable to establish database connection after retries');
            throw new Error('Database connection failed');
        }

        console.log('✅ Database Connection: Successful');
        console.log(`📍 Connected to: ${sequelize.config.database}`);
        console.log(`🔐 Connection User: ${sequelize.config.username}`);

        // Synchronize models
        await sequelize.sync({
            force: false,  // Prevent dropping existing tables
            alter: true    // Safely alter table structure if models change
        });
        console.log('🗄️ Database Models: Synchronized Successfully');

        return true;
    } catch (error) {
        console.error('❌ Database Initialization Failed:', error);

        // Provide specific error messages based on error type
        if (error.name === 'SequelizeConnectionError') {
            console.error('   Connection Error: Check if database server is running');
        } else if (error.name === 'SequelizeConnectionRefusedError') {
            console.error('   Connection Refused: Check database credentials and permissions');
        } else if (error.name === 'SequelizeHostNotFoundError') {
            console.error('   Host Not Found: Check database host configuration');
        } else if (error.original && error.original.code === '3D000') {
            console.error('   Database Not Found: The specified database does not exist');
        }

        throw error;
    }
};

module.exports = {
    sequelize,
    initializeDatabase,
    testConnection
};