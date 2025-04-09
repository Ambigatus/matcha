// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const { sanitizeRequest } = require('./utils/sanitize');
const { errorHandler } = require('./middleware/errorHandler');

// Import database connection
const { sequelize, initializeDatabase } = require('./config/database');
// Import Sequelize models
const models = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const browseRoutes = require('./routes/browseRoutes');
const likeRoutes = require('./routes/likeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const interactionRoutes = require('./routes/interactionRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization middleware
app.use(sanitizeRequest);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interactions', interactionRoutes);

// Initialize Socket.io controller
require('./controllers/socketController')(io);

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

// Global error handler
app.use(errorHandler);

// Start server after database initialization
const startServer = async () => {
    try {
        // Initialize database and sync models
        await initializeDatabase();

        // Start the server
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API is available at http://localhost:${PORT}`);
            console.log(`Socket.io is running`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();