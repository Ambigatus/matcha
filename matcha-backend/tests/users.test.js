const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const pool = require('../db/db'); // Пул для управления подключением к БД

require('dotenv').config();

describe('User Routes', () => {
    let token; // Токен для защищенных маршрутов
    let testUser = {
        username: 'test_user',
        email: 'test@example.com',
        password: 'password123',
    };

    // Очистка тестовых данных перед каждым тестом
    beforeAll(async () => {
        // Удаляем тестового пользователя, если он существует
        await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    });

    afterAll(async () => {
        // Закрываем пул подключения к базе данных
        await pool.end();
    });

    // ========================= Тест регистрации =========================
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/users/register')
            .send(testUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
        expect(res.body.user).toHaveProperty('username', testUser.username);
    });

    // ========================= Тест логина =========================
    it('should log in an existing user', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Login successful');
        expect(res.body).toHaveProperty('token');

        // Сохраняем токен для следующего теста
        token = res.body.token;
    });

    // ========================= Тест защищенного маршрута =========================
    it('should return user profile with valid token', async () => {
        const res = await request(app)
            .get('/users/profile')
            .set('Authorization', token); // Передаем токен в заголовке

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('username', testUser.username);
        expect(res.body).toHaveProperty('email', testUser.email);
    });

    it('should deny access to profile without token', async () => {
        const res = await request(app)
            .get('/users/profile'); // Не передаем токен

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should deny access to profile with invalid token', async () => {
        const res = await request(app)
            .get('/users/profile')
            .set('Authorization', 'invalid_token'); // Передаем неверный токен

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('error', 'Invalid token');
    });
});
