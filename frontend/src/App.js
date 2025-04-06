// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Import pages
import Home from './pages/Home';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import VerifyEmail from './pages/auth/VerifyEmail';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/profile/Profile';
import ProfileEdit from './pages/profile/ProfileEdit';
import Browse from './pages/browse/Browse';
import ViewProfile from './pages/browse/ViewProfile';
import Matches from './pages/matches/Matches';
import Chat from './pages/chat/Chat';
import NotFound from './pages/NotFound';

// Import context/provider
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';

function App() {
  return (
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="container mx-auto px-4 py-8 min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected routes */}
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/profile/edit" element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
                <Route path="/browse" element={<PrivateRoute><Browse /></PrivateRoute>} />
                <Route path="/browse/profile/:profileId" element={<PrivateRoute><ViewProfile /></PrivateRoute>} />
                <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
                <Route path="/chat/:matchId" element={<PrivateRoute><Chat /></PrivateRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </Router>
      </AuthProvider>
  );
}

export default App;