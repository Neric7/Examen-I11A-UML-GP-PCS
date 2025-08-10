import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import Accueil from './pages/Accueil';
import Watch from './pages/Watch';
import NotFound from './pages/NotFound';
import LogoutPage from './pages/LogoutPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/globals.css';
import './App.css';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                // Dans App.js
<Route
  path="/profile/:userId?"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
                <Route
                  path="/friends"
                  element={
                    <ProtectedRoute>
                      <Friends />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <Groups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/accueil" element={<Accueil />} />
                <Route
                  path="/watch"
                  element={
                    <ProtectedRoute>
                      <Watch />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </PostProvider>
    </AuthProvider>
  );
}

export default App;