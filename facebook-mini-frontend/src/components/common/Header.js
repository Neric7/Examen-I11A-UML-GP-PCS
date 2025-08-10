import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './style.css'; // ou Header.module.css si tu préfères CSS modules

const Header = () => {
  const { user, refreshUserData, refreshing } = useAuth();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    try {
      const result = await refreshUserData();
      if (result?.success) {
        window.dispatchEvent(new CustomEvent('app-refresh'));
        setLastRefresh(new Date());
        console.log('Données actualisées avec succès');
      } else {
        console.error('Erreur lors de l\'actualisation:', result?.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
    }
  }, [refreshing, refreshUserData, setLastRefresh]); // Ajout de setLastRefresh dans les dépendances

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'F5') {
        event.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleRefresh]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);


  // Fonction pour basculer le mode sombre (maintenant utilisée)
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <header className={`header ${darkMode ? 'dark' : 'light'}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          {/* Version courte pour économiser de l'espace */}
          {window.innerWidth > 768 ? 'Mini Facebook' : 'MF'} 
        </Link>

        <nav>
          {user ? (
            <div className="nav-links">
              {/* Icône seule sur mobile */}
              <Link to="/" className="nav-link" title="Accueil">
                {window.innerWidth > 768 ? '🏠 Accueil' : '🏠'}
              </Link>

              {/* Bouton refresh plus compact */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="refresh-btn"
                title={`Actualiser (F5) - Dernière actualisation: ${lastRefresh.toLocaleTimeString()}`}
              >
                <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>
                  🔄
                </span>
                {window.innerWidth > 768 && (
                  <span className="refresh-text">
                    {refreshing ? '...' : 'Actualiser'}
                  </span>
                )}
              </button>

              <span className="user-greeting">
                Bonjour, {user.firstName || user.first_name ? (user.firstName || user.first_name) : user.username}!
              </span>

              <Link to="/logout" className="logout-btn">
                Déconnexion
              </Link>

            </div>
          ) : (
            <div className="nav-links">
              <Link to="/login" className="nav-link">Connexion</Link>
              <Link to="/register" className="nav-link">Inscription</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;