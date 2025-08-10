// hooks/useRefreshListener.js
import { useEffect } from 'react';

// Hook pour écouter l'événement d'actualisation global
export const useRefreshListener = (callback) => {
  useEffect(() => {
    const handleRefresh = () => {
      if (callback) {
        callback();
      }
    };

    window.addEventListener('app-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('app-refresh', handleRefresh);
    };
  }, [callback]);
};

// Exemple d'utilisation dans un composant (ex: HomePage, PostsList, etc.)
// components/HomePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useRefreshListener } from '../hooks/useRefreshListener';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour charger les posts
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les posts au montage du composant
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Écouter l'événement d'actualisation du header
  useRefreshListener(loadPosts);

  return (
    <div className="home-page">
      <h1>Accueil</h1>
      {loading ? (
        <div>Chargement des posts...</div>
      ) : (
        <div className="posts-container">
          {posts.map(post => (
            <div key={post.id} className="post">
              {/* Contenu du post */}
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;