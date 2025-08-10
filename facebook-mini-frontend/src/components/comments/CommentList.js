import React, { useState, useEffect } from 'react';
import CommentCard from './CommentCard';
import CreateComment from './CreateComment';
import commentService from '../../services/commentService';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

const CommentList = ({ postId, initialCommentsCount = 0 }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalComments: initialCommentsCount,
    hasMore: false
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Charger les commentaires
  const fetchComments = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const response = await commentService.getCommentsByPost(postId, page);
      
      if (response.success) {
        const newComments = response.data.comments;
        
        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }
        
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Charger plus de commentaires
  const loadMoreComments = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchComments(pagination.currentPage + 1, true);
    }
  };

  // Gérer l'ajout d'un nouveau commentaire
  const handleCommentAdded = (newComment) => {
    setComments(prev => [newComment, ...prev]);
    setPagination(prev => ({
      ...prev,
      totalComments: prev.totalComments + 1
    }));
    
    if (!showComments) {
      setShowComments(true);
    }
  };

  // Gérer la modification d'un commentaire
  const handleCommentUpdated = (updatedComment) => {
    setComments(prev => prev.map(comment => 
      comment.id === updatedComment.id ? updatedComment : comment
    ));
  };

  // Gérer la suppression d'un commentaire
  const handleCommentDeleted = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setPagination(prev => ({
      ...prev,
      totalComments: prev.totalComments - 1
    }));
  };

  // Basculer l'affichage des commentaires
  const toggleComments = () => {
    setShowComments(prev => !prev);
    
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  // Charger les commentaires si ils sont affichés au montage
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments, postId]);

  return (
    <div className="comments-section">
      {/* Bouton pour afficher/masquer les commentaires */}
      <div className="comments-header">
        <button 
          onClick={toggleComments}
          className="comments-toggle-btn"
        >
          {showComments ? 'Masquer' : 'Voir'} les commentaires 
          ({pagination.totalComments})
        </button>
      </div>

      {showComments && (
        <div className="comments-container">
          {/* Formulaire d'ajout de commentaire */}
          <CreateComment 
            postId={postId} 
            onCommentAdded={handleCommentAdded}
          />

          {/* Messages d'erreur */}
          {error && <ErrorMessage message={error} />}

          {/* Indicateur de chargement */}
          {loading && <Loading />}

          {/* Liste des commentaires */}
          {!loading && comments.length > 0 && (
            <div className="comments-list">
              {comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                />
              ))}

              {/* Bouton "Charger plus" */}
              {pagination.hasMore && (
                <div className="load-more-container">
                  <button 
                    onClick={loadMoreComments}
                    disabled={loadingMore}
                    className="load-more-btn"
                  >
                    {loadingMore ? 'Chargement...' : 'Voir plus de commentaires'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message si aucun commentaire */}
          {!loading && comments.length === 0 && (
            <div className="no-comments">
              <p>Aucun commentaire pour le moment. Soyez le premier à commenter !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentList;