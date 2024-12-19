const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
    // Получаем токен из заголовка
    const token = req.header('Authorization');

    // Проверка наличия токена
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Проверка токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Добавляем пользователя в объект запроса
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
