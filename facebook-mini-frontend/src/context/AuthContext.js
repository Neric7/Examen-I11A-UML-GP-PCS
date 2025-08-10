import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

// Dans votre AuthContext.js
const logout = useCallback((navigate) => {
  localStorage.removeItem('token');
  setToken(null);
  setUser(null);
  if (navigate) {
    navigate('/login');
  }
}, []);

  // Configuration axios avec gestion du token
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
    });

    // Intercepteur pour ajouter le token aux requêtes
    instance.interceptors.request.use(config => {
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    }, error => Promise.reject(error));

    // Intercepteur pour gérer les erreurs 401
    instance.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token, logout]); // Ajout de logout comme dépendance

  // Vérification de l'authentification au chargement
  const checkAuth = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/verify');
      if (response.data.user) {
        setUser(response.data.user);
        setToken(savedToken);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [api, logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Rafraîchissement des données utilisateur
  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      const response = await api.get(`/users/${user.id}/profile`);
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Erreur de rafraîchissement:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, api, logout]);

  // Connexion
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token: authToken, user: userData } = response.data;

      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  };

  // Inscription
  const register = async (userData) => {
    try {
      const config = userData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } } 
        : {};

      const response = await api.post('/auth/register', userData, config);
      const { token: authToken, user: newUser } = response.data;

      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur d\'inscription'
      };
    }
  };

  // Mise à jour de l'utilisateur
  const updateUser = useCallback((updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  }, []);

  const value = {
    user,
    token,
    loading,
    refreshing,
    api,
    login,
    register,
    logout,
    refreshUserData,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};