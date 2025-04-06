import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const loginUser = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/login`, { email, password });
    return response.data;
};

// Другие функции для регистрации, получения профиля и т.д.
