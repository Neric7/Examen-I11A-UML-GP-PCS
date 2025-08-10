import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addPost } = usePost();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    
    try {
      // Simulation d'ajout de post (remplacer par un appel API)
      const newPost = {
        id: Date.now(),
        content: content.trim(),
        author: user,
        createdAt: new Date().toISOString()
      };
      
      addPost(newPost);
      setContent('');
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #ddd',
      marginBottom: '2rem'
    }}>
      <h3>Créer une publication</h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Que voulez-vous partager ?"
          rows="4"
          style={{ 
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '1rem',
            resize: 'vertical'
          }}
        />
        
        <button 
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: loading || !content.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Publication...' : 'Publier'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;