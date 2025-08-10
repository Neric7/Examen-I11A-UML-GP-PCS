import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import commentService from '../../services/commentService';
import { formatDate } from '../../utils/helpers';

const CommentCard = ({ comment, onCommentUpdated, onCommentDeleted }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthor = user && user.id === comment.author_id;

  // Gérer la modification du commentaire
  const handleEdit = async () => {
    if (!editContent.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await commentService.updateComment(comment.id, editContent.trim());
      
      if (response.success) {
        onCommentUpdated(response.data);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification du commentaire');
    } finally {
      setLoading(false);
    }
  };

  // Annuler la modification
  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
    setError(null);
  };

  // Gérer la suppression du commentaire
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await commentService.deleteComment(comment.id);
      
      if (response.success) {
        onCommentDeleted(comment.id);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression du commentaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-card">
      <div className="comment-header">
        <div className="comment-author">
          {comment.profile_picture && (
            <img 
              src={comment.profile_picture} 
              alt={comment.username}
              className="comment-avatar"
            />
          )}
          <div className="comment-author-info">
            <h4 className="comment-username">{comment.username}</h4>
            <span className="comment-date">
              {formatDate(comment.comment_date)}
              {comment.updated_at !== comment.created_at && (
                <span className="edited-indicator"> (modifié)</span>
              )}
            </span>
          </div>
        </div>

        {/* Actions pour l'auteur du commentaire */}
        {isAuthor && !isEditing && (
          <div className="comment-actions">
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-btn"
              disabled={loading}
            >
              Modifier
            </button>
            <button 
              onClick={handleDelete}
              className="delete-btn"
              disabled={loading}
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        )}
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="comment-edit-textarea"
              rows="3"
              maxLength="1000"
              disabled={loading}
            />
            
            <div className="comment-edit-actions">
              <button 
                onClick={handleEdit}
                className="save-btn"
                disabled={loading || !editContent.trim()}
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button 
                onClick={handleCancelEdit}
                className="cancel-btn"
                disabled={loading}
              >
                Annuler
              </button>
            </div>

            {error && (
              <div className="comment-error">
                {error}
              </div>
            )}
          </div>
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}
      </div>
    </div>
  );
};

export default CommentCard;