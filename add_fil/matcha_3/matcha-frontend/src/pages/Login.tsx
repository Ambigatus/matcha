
import React, { useState } from 'react';
import Button from "../components/Button.tsx";
import Input from "../components/Input.tsx";
import { useNavigate } from 'react-router-dom'; // React Router v6 hook for navigation

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const navigate = useNavigate(); // hook to navigate programmatically

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Easy validation
        if (!email || !password) {
            setError('Please, fill in all fields!');
            return;
        }

        // Simulate an API request for login
        console.log('Logging in with:', email, password);

        // Simulate successful login
        const token = 'valid-token'; // Replace with actual token received from API
        localStorage.setItem('authToken', token); // Store token in localStorage

        // Set success message
        setSuccess('Login was successful!');

        // Redirect to Profile page after successful login
        navigate('/profile');
    };

    return (
        <div className="transparent-box">
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <Input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <Input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <Button type="submit">Login</Button>
            </form>
        </div>
    );
};

export default Login;

