import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#1877f2', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page non trouvée</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Désolé, la page que vous recherchez n'existe pas.
      </p>
      <Link 
        to="/" 
        style={{ 
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1877f2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFound;