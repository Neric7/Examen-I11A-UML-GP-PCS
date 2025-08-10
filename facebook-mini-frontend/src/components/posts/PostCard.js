import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import CommentList from '../comments/CommentList';
import postService from '../../services/postService';
import { formatDate } from '../../utils/helpers';

const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(post.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  const isAuthor = user && user.id === post.author_id;

  // Gérer le like/unlike
  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await postService.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await postService.likePost(post.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Erreur lors du like/unlike:', err);
    }
  };

  // Gérer la modification du post
  const handleEdit = async () => {
    if (!editContent.trim()) {
      setError('Le contenu du post ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await postService.updatePost(post.id, { content: editContent.trim() });
      
      if (response.success) {
        onPostUpdated(response.data);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification du post');
    } finally {
      setLoading(false);
    }
  };

  // Annuler la modification
  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
    setError(null);
  };

  // Gérer la suppression du post
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await postService.deletePost(post.id);
      
      if (response.success) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression du post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-card">
      {/* Header du post */}
      <div className="post-header">
        <div className="post-author">
          {post.profile_picture && (
            <img 
              src={post.profile_picture} 
              alt={post.username}
              className="post-avatar"
            />
          )}
          <div className="post-author-info">
            <h3 className="post-username">{post.username}</h3>
            <span className="post-date">
              {formatDate(post.publication_date)}
              {post.updated_at !== post.created_at && (
                <span className="edited-indicator"> (modifié)</span>
              )}
            </span>
          </div>
        </div>

        {/* Actions pour l'auteur du post */}
        {isAuthor && !isEditing && (
          <div className="post-actions">
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

      {/* Contenu du post */}
      <div className="post-content">
        {isEditing ? (
          <div className="post-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="post-edit-textarea"
              rows="4"
              maxLength="5000"
              disabled={loading}
            />
            
            <div className="post-edit-actions">
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
              <div className="post-error">
                {error}
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="post-text">{post.content}</p>
            
            {/* Image du post si elle existe */}
            {post.image_url && (
              <div className="post-image">
                <img src={post.image_url} alt="Post image" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions du post (like, commentaires) */}
      {!isEditing && (
        <div className="post-interactions">
          <div className="post-stats">
            <span className="likes-count">{likesCount} j'aime</span>
            <span className="comments-count">{commentsCount} commentaires</span>
          </div>

          <div className="post-actions-bar">
            <button 
              onClick={handleLike}
              className={`like-btn ${isLiked ? 'liked' : ''}`}
              disabled={!user}
            >
              {isLiked ? '❤️' : '🤍'} J'aime
            </button>
            
            <button className="comment-btn">
              💬 Commenter
            </button>
            
            <button className="share-btn">
              📤 Partager
            </button>
          </div>

          {/* Section des commentaires */}
          <CommentList 
            postId={post.id} 
            initialCommentsCount={commentsCount}
          />
        </div>
      )}

      {/* Messages d'erreur globaux */}
      {error && !isEditing && (
        <div className="post-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default PostCard;