// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
// Required to add socket.io to package.json dependencies

// Import database connection
const { sequelize, initializeDatabase } = require('./config/database');
// Import Sequelize models
const models = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const browseRoutes = require('./routes/browseRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIO(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Import socket controller
const socketController = require('./controllers/socketController');
socketController(io);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await sequelize.query('SELECT NOW()');
        res.json({
            message: 'Database connection successful',
            timestamp: result[0][0].now,
            models: Object.keys(models)
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Root route for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Matcha API',
        version: '1.0.0',
        status: 'Online'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server after database initialization
const startServer = async () => {
    try {
        // Initialize database and sync models
        await initializeDatabase();

        // Start the server (using the HTTP server for Socket.io)
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API is available at http://localhost:${PORT}`);
            console.log(`Socket.io is running on the same port`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();