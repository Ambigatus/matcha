// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Page Components
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Profile from './pages/profile/Profile';
import ProfileEdit from './pages/profile/ProfileEdit';
import Browse from './pages/browse/Browse';
import ViewProfile from './pages/browse/ViewProfile';
import Matches from './pages/matches/Matches';
import Chat from './pages/chat/Chat';
import NotFound from './pages/NotFound';

// Routing Components
import PrivateRoute from './components/routing/PrivateRoute';

const App = () => {
  return (
      <AuthProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={5000} />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                {/* Private Routes */}
                <Route path="/profile" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />
                <Route path="/profile/edit" element={
                  <PrivateRoute>
                    <ProfileEdit />
                  </PrivateRoute>
                } />
                <Route path="/browse" element={
                  <PrivateRoute>
                    <Browse />
                  </PrivateRoute>
                } />
                <Route path="/browse/profile/:profileId" element={
                  <PrivateRoute>
                    <ViewProfile />
                  </PrivateRoute>
                } />
                <Route path="/matches" element={
                  <PrivateRoute>
                    <Matches />
                  </PrivateRoute>
                } />
                <Route path="/chat/:matchId" element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } />
                <Route path="/chat" element={
                  <PrivateRoute>
                    <Navigate to="/matches" replace />
                  </PrivateRoute>
                } />

                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
  );
};

export default App;