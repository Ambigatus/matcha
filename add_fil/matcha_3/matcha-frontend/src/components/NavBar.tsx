import React, { useEffect, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import '../styles/NavBar.css';
import classNames from "classnames";





const NavBar: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the user is logged in
        const token = localStorage.getItem('authToken');
        setIsLoggedIn(!!token);

        // Toggle dark mode class based on isDarkMode
        document.body.classList.toggle('dark-mode', isDarkMode);
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('dark-mode', isDarkMode);
        }
    }, [isDarkMode]); // This effect depends on `isDarkMode` state


    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const darkClass = classNames('navbar', {
        'dark-mode': isDarkMode,
        'light-mode': !isDarkMode,
    });

    return (
        <nav className={darkClass}>
            <div className="logo_container">
                <h1 className="logo">Matcha</h1>
                <img alt={'logo'} src={'../src/assets/images/couple.png'}/>
            </div>

            <ul>
                <li><Link to="/">Home</Link></li>
                {isLoggedIn ? (
                    <>
                        {/*part of buttons which we see only in Profile mode*/}
                        <li><Link to="/profile">Profile</Link></li>
                        <li><Link onClick={() => navigate('/edit-profile')} to="/edit-profile">Edit Profile</Link></li>
                        <li><Link to="/match">Go Match!</Link></li>
                        <li><Link onClick={handleLogout} to="/">Logout</Link></li>
                    </>
                ) : (
                    <>
                    <li><Link to="/login">Login</Link></li>
                        <li><Link to="/register">Register</Link></li>
                    </>
                )}
            </ul>
            <button onClick={toggleDarkMode} className="toggle-btn">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
        </nav>
    );
};

export default NavBar;
