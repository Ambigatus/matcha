const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/db'); // Подключение к базе данных
const auth = require('../middleware/auth'); // Middleware для защиты маршрутов
require('dotenv').config();

const router = express.Router();

// =========================== Регистрация пользователя ===========================
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Проверка на существование пользователя
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Хэширование пароля
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Сохранение пользователя в базу данных
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// =========================== Логин пользователя ===========================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Проверка существования пользователя
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // Проверка пароля
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Генерация JWT-токена
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// =========================== Защищенный маршрут: Получение профиля ===========================
router.get('/profile', auth, async (req, res) => {
    try {
        // Получаем информацию о пользователе из базы данных
        const user = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
