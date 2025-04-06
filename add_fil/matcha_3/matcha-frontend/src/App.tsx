// src/App.tsx
// import React, {useState} from 'react';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Registration from './pages/Registration';
import Profile from './pages/Profile';
import NavBar from './components/NavBar';
import '../src/styles/App.css'
import Match from "./pages/Match.tsx";



const App: React.FC = () => {
    return (
        <Router>
            <NavBar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registration />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/match" element={<Match />} />
            </Routes>
        </Router>
    );
};

export default App;
