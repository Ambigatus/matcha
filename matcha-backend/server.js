const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Matcha Backend API is running!');
});

app.use('/users', require('./routes/users'));

// Экспорт приложения
module.exports = app;
