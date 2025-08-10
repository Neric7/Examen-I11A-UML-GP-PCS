import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import commentService from '../../services/commentService';

const CreateComment = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gérer la soumission du commentaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await commentService.createComment(postId, content.trim());
      
      if (response.success) {
        setContent('');
        onCommentAdded(response.data);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du commentaire');
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'appui sur Entrée (Ctrl+Entrée pour soumettre)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  if (!user) {
    return (
      <div className="create-comment-login">
        <p>Connectez-vous pour commenter</p>
      </div>
    );
  }

  return (
    <div className="create-comment">
      <div className="create-comment-header">
        {user.profile_picture && (
          <img 
            src={user.profile_picture} 
            alt={user.username}
            className="create-comment-avatar"
          />
        )}
        <span className="create-comment-username">{user.username}</span>
      </div>

      <form onSubmit={handleSubmit} className="create-comment-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre commentaire... (Ctrl+Entrée pour publier)"
          className="create-comment-textarea"
          rows="3"
          maxLength="1000"
          disabled={loading}
        />

        <div className="create-comment-footer">
          <div className="create-comment-info">
            <span className="character-count">
              {content.length}/1000
            </span>
            <span className="shortcut-hint">
              Ctrl+Entrée pour publier
            </span>
          </div>

          <button 
            type="submit"
            className="create-comment-btn"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Publication...' : 'Commenter'}
          </button>
        </div>

        {error && (
          <div className="create-comment-error">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateComment;