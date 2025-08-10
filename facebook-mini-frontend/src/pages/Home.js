import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Bell, Mail, Users, Home, ThumbsUp, MessageCircle, Share, X, UserPlus, MoreHorizontal, Trash2, Edit3,
  Heart, Calendar, Check, CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles.css';

const FacebookHomepage = () => {
  const { user, token } = useAuth();
  
  // État pour la navigation - DÉPLACÉ À L'INTÉRIEUR DU COMPOSANT
  const [currentPage, setCurrentPage] = useState('accueil');
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  
  // États pour la modification
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // États pour les amis - maintenant depuis la base de données
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);

    // Dans le composant, ajouter ces états
  const [friends, setFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [markingAsRead, setMarkingAsRead] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

// États supplémentaires à ajouter dans votre composant principal
const [comments, setComments] = useState({}); // Format: { postId: [comments] }
const [showComments, setShowComments] = useState({}); // Format: { postId: boolean }
const [newComment, setNewComment] = useState({}); // Format: { postId: string }
const [isCommenting, setIsCommenting] = useState({});
const [loadingComments, setLoadingComments] = useState({});

// NOUVEAUX ÉTATS POUR LES MESSAGES - À AJOUTER AU NIVEAU DU COMPOSANT
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
// Fonctions pour les notifications (à ajouter avec vos autres fonctions)
const fetchNotifications = async (filter = 'all') => {
  try {
    setLoadingNotifications(true);
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:3001/api/notifications?filter=${filter}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } else {
      console.error('Erreur lors de la récupération des notifications');
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
  } finally {
    setLoadingNotifications(false);
  }
};

// Ajouter cette fonction pour récupérer les amis acceptés
const fetchAcceptedFriends = async () => {
  try {
    console.log('🔄 Récupération des amis acceptés...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('❌ Pas de token trouvé');
      return;
    }

    const response = await fetch('http://localhost:3001/api/friends/accepted', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const acceptedFriends = await response.json();
    console.log('✅ Amis acceptés récupérés:', acceptedFriends);

    // Transformer les données pour correspondre au format attendu dans votre composant
    const formattedFriends = acceptedFriends.map(friendship => ({
      id: friendship.friend.id,
      username: friendship.friend.username,
      profile_picture: friendship.friend.profile_picture,
      last_login: friendship.friend.last_login,
      is_online: friendship.friend.is_online || false,
      friendship_id: friendship.friendship_id
    }));

    setFriends(formattedFriends);
    console.log('📊 Amis formatés et mis à jour:', formattedFriends);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des amis:', error);
    // Optionnel : afficher une notification d'erreur à l'utilisateur
  }
};

// Fonction pour récupérer les commentaires d'un post - CORRIGÉE
const fetchComments = async (postId) => {
  if (loadingComments[postId]) return;
  
  setLoadingComments(prev => ({ ...prev, [postId]: true }));
  
  try {
    // ✅ CORRECTION : Utiliser la bonne URL selon votre route backend
    const response = await fetch(`http://localhost:3001/api/comments/post/${postId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Comments received:', data); // Pour debug
      setComments(prev => ({
        ...prev,
        [postId]: data.data || data.comments || [] // Gérer différents formats de réponse
      }));
    } else {
      console.error('Erreur lors de la récupération des commentaires:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error('Error details:', errorData);
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    setLoadingComments(prev => ({ ...prev, [postId]: false }));
  }
};

const handleMoreOptions = (friendId) => {
  console.log('Plus d\'options pour:', friendId);
  // Afficher un menu contextuel
};

const handleSearchFriends = (term) => {
  setSearchTerm(term);
  
  if (!term.trim()) {
    setFilteredFriends(friends);
    return;
  }

  const filtered = friends.filter(friend => 
    getFullName(friend).toLowerCase().includes(term.toLowerCase()) ||
    friend.username.toLowerCase().includes(term.toLowerCase())
  );
  
  setFilteredFriends(filtered);
};

// Fonction pour basculer l'affichage des commentaires
const toggleComments = async (postId) => {
  const isCurrentlyShown = showComments[postId];
  
  setShowComments(prev => ({
    ...prev,
    [postId]: !isCurrentlyShown
  }));

  // Si on ouvre les commentaires et qu'ils ne sont pas encore chargés
  if (!isCurrentlyShown && !comments[postId]) {
    await fetchComments(postId);
  }
};

// Fonction pour ajouter un commentaire
const handleAddComment = async (postId) => {
  const content = newComment[postId]?.trim();
  if (!content) return;

  setIsCommenting(prev => ({ ...prev, [postId]: true }));

  try {
    const response = await fetch(`http://localhost:3001/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        content,
        postId: parseInt(postId)
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Ajouter le nouveau commentaire à la liste
      setComments(prev => ({
        ...prev,
        [postId]: [data.data, ...(prev[postId] || [])]
      }));

      // Vider le champ de saisie
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));

      // Mettre à jour le compteur de commentaires du post
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === parseInt(postId) 
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post
        )
      );

    } else {
      const errorData = await response.json();
      console.error('Erreur lors de l\'ajout du commentaire:', errorData.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    setIsCommenting(prev => ({ ...prev, [postId]: false }));
  }
};

// Version avec debug complet pour identifier le problème
const handleLikeComment = async (commentId) => {
  try {
    console.log('=== DEBUG LIKE COMMENT ===');
    console.log('Comment ID:', commentId);
    console.log('User:', user);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    };

    console.log('Request options:', requestOptions);
    console.log('Request URL:', `http://localhost:3001/api/comments/${commentId}/like`);

    const response = await fetch(`http://localhost:3001/api/comments/${commentId}/like`, requestOptions);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('Success data:', data);
      
      // Mettre à jour le statut de like du commentaire
      setComments(prev => {
        const newComments = { ...prev };
        Object.keys(newComments).forEach(postId => {
          newComments[postId] = newComments[postId].map(comment => 
            comment.id === commentId 
              ? { 
                  ...comment, 
                  user_liked: data.liked !== undefined ? data.liked : !comment.user_liked,
                  likes_count: data.likes_count !== undefined 
                    ? data.likes_count 
                    : comment.user_liked 
                      ? (comment.likes_count || 0) - 1 
                      : (comment.likes_count || 0) + 1
                }
              : comment
          );
        });
        return newComments;
      });
    } else {
      // Afficher l'erreur détaillée
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.error('Parsed error data:', errorData);
      } catch (e) {
        console.error('Could not parse error as JSON');
      }
    }
  } catch (error) {
    console.error('Network or other error:', error);
  }
};

// Fonction pour formater la date des commentaires
const formatCommentDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `${diffInMinutes}min`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}j`;
  
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });
};

// Composant pour un commentaire individuel
const CommentItem = ({ comment, onLike }) => {
  const commentAuthorPicture = comment.profile_picture;
  const commentAuthorName = comment.username || 'Utilisateur';

  return (
    <div className="fb-comment-item">
      <div className="fb-comment-avatar-container">
        {commentAuthorPicture ? (
          <img 
            src={`http://localhost:3001/uploads/profile-pictures/${commentAuthorPicture}`}
            alt={commentAuthorName}
            className="fb-comment-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
              const placeholder = e.target.parentNode.querySelector('.fb-comment-avatar-placeholder');
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className="fb-comment-avatar-placeholder"
          style={{ display: commentAuthorPicture ? 'none' : 'flex' }}
        >
          {commentAuthorName.charAt(0).toUpperCase()}
        </div>
      </div>
      
      <div className="fb-comment-content">
        <div className="fb-comment-bubble">
          <div className="fb-comment-author">{commentAuthorName}</div>
          <div className="fb-comment-text">{comment.content}</div>
        </div>
        
        <div className="fb-comment-actions">
          <button
            onClick={() => onLike(comment.id)}
            className={`fb-comment-action ${comment.user_liked ? 'liked' : ''}`}
          >
            J'aime
          </button>
          <span className="fb-comment-date">
            {formatCommentDate(comment.comment_date || comment.created_at)}
          </span>
          {comment.likes_count > 0 && (
            <span className="fb-comment-likes">
              {comment.likes_count} J'aime
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Section des commentaires à ajouter dans votre JSX (après les actions du post)
const renderCommentsSection = (post, isDeleting) => (
  <div className="fb-comments-section">
    {/* Bouton pour afficher/masquer les commentaires */}
    <button
      onClick={() => toggleComments(post.id)}
      className="fb-comments-toggle"
      disabled={isDeleting}
    >
      {showComments[post.id] ? 'Masquer' : 'Voir'} les commentaires
      {post.comments_count > 0 && ` (${post.comments_count})`}
    </button>

    {/* Section des commentaires */}
    {showComments[post.id] && (
      <div className="fb-comments-container">
        {/* Formulaire d'ajout de commentaire */}
        <div className="fb-add-comment">
          <div className="fb-comment-avatar-container">
            {userProfilePicture ? (
              <img 
                src={`http://localhost:3001/uploads/profile-pictures/${userProfilePicture}`}
                alt={user.username}
                className="fb-comment-avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentNode.querySelector('.fb-comment-avatar-placeholder');
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div 
              className="fb-comment-avatar-placeholder"
              style={{ display: userProfilePicture ? 'none' : 'flex' }}
            >
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          
          <div className="fb-comment-input-container">
            <textarea
              placeholder="Écrivez un commentaire..."
              value={newComment[post.id] || ''}
              onChange={(e) => setNewComment(prev => ({
                ...prev,
                [post.id]: e.target.value
              }))}
              className="fb-comment-input"
              rows="1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment(post.id);
                }
              }}
            />
            <button
              onClick={() => handleAddComment(post.id)}
              disabled={isCommenting[post.id] || !newComment[post.id]?.trim()}
              className="fb-comment-submit"
            >
              {isCommenting[post.id] ? '...' : '➤'}
            </button>
          </div>
        </div>

        {/* Liste des commentaires */}
        <div className="fb-comments-list">
          {loadingComments[post.id] ? (
            <div className="fb-comments-loading">Chargement des commentaires...</div>
          ) : comments[post.id]?.length > 0 ? (
            comments[post.id].map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLikeComment}
              />
            ))
          ) : (
            <div className="fb-no-comments">Aucun commentaire pour le moment.</div>
          )}
        </div>
      </div>
    )}
  </div>
);

  // Fonction helper pour récupérer la photo de profil
const getProfilePicture = (userData) => {
  if (!userData) return null;
  return userData.profilePicture || userData.profile_picture;
};

  // Fonction helper pour récupérer le nom complet
const getFullName = (userData) => {
  if (!userData) return 'Utilisateur inconnu';
  const firstName = userData.firstName || userData.first_name;
  const lastName = userData.lastName || userData.last_name;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return userData.username || 'Utilisateur inconnu';
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return <Heart size={16} className="fb-like-icon" />;
    case 'comment':
    case 'reply':
      return <MessageCircle size={16} className="fb-comment-icon" />;
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus size={16} className="fb-friend-icon" />;
    case 'mention':
      return <Users size={16} className="fb-mention-icon" />;
    case 'birthday':
      return <Calendar size={16} className="fb-birthday-icon" />;
    default:
      return <Bell size={16} className="fb-notification-icon" />;
  }
};
// const getNotificationMessage = (notification) => {
//   // Utiliser le message généré par le backend ou créer un message personnalisé
//   return notification.message;
// };

const getNotificationMessage = (notification) => {
  const actorName = getFullName(notification.actor);
  
  switch(notification.type) {
    case 'like':
      return `${actorName} a aimé votre publication`;
    case 'comment':
      return `${actorName} a commenté votre publication`;
    case 'friend_request':
      return `${actorName} vous a envoyé une demande d'ami`;
    case 'friend_accepted':
      return `${actorName} a accepté votre demande d'ami`;
    case 'birthday':
      return `C'est l'anniversaire de ${actorName} aujourd'hui !`;
    case 'mention':
      return `${actorName} vous a mentionné dans une publication`;
    default:
      return notification.message || 'Nouvelle notification';
  }
};

// Et modifiez aussi le renderCurrentPage pour utiliser renderAmisContent
const renderCurrentPage = () => {
  switch(currentPage) {
    case 'accueil':
      return renderAccueilContent();
    case 'amis':
      return renderAmisContent(); // Changé ici
    case 'notifications':
      return renderNotificationsContent();
    case 'messages':
      return renderMessagesContent();
    default:
      return renderAccueilContent();
  }
};
  // Contenu de la page d'accueil
  const renderAccueilContent = () => (
    <>
      {/* Créer un post */}
      <div className="fb-create-post">
        <div className="fb-post-input-container">
          <Link to="/profile" className="fb-profile-link">
            <div className="fb-profile-pic-container">
              {userProfilePicture ? (
                <img 
                  src={`http://localhost:3001/uploads/profile-pictures/${userProfilePicture}`}
                  alt={`Profil de ${user.username}`}
                  className="fb-post-avatar"
                  onError={(e) => {
                    console.error('Erreur chargement image create post:', e.target.src);
                    e.target.style.display = 'none';
                    const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  }}
                  onLoad={(e) => {
                    const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                    if (placeholder) {
                      placeholder.style.display = 'none';
                    }
                  }}
                />
              ) : null}
              <div 
                className="fb-profile-avatar-placeholder"
                style={{ display: userProfilePicture ? 'none' : 'flex' }}
              >
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </Link>
          <textarea
            placeholder="Quoi de neuf ?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="fb-post-input"
            rows="1"
          />
        </div>

        {/* Prévisualisation de l'image */}
        {imagePreview && (
          <div className="fb-image-preview-container">
            <img 
              src={imagePreview} 
              alt="Aperçu" 
              className="fb-image-preview"
            />
            <button
              onClick={removeImage}
              className="fb-remove-image-btn"
            >
              <X className="fb-remove-image-icon" />
            </button>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <p className="fb-error-message">{error}</p>
        )}

        <div className="fb-post-actions-container">
          <label
            htmlFor="imageInput"
            className="fb-upload-btn"
            title="Ajouter une image"
          >
            <input 
              type="file"
              id="imageInput"
              accept="image/*"
              onChange={handleImageSelect}
              className="fb-file-input"
            />
            📷
          </label>

          <button
            onClick={handleNewPost}
            disabled={isPosting}
            className="fb-primary-btn"
          >
            {isPosting ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>

      {/* Liste des posts */}
      <div className="fb-posts-list">
        {loading ? (
          <p>Chargement des publications...</p>
        ) : posts.length === 0 ? (
          <p>Aucune publication à afficher.</p>
        ) : (
          posts.map(post => {
            if (!post || !post.author) {
              console.warn('Post sans auteur:', post);
              return null;
            }

            const postAuthorPicture = getProfilePicture(post.author);
            const postAuthorName = getFullName(post.author);
            const isDeleting = deletingPost === post.id;
            const isEditing = editingPost === post.id;

            return (
              <div key={post.id} className={`fb-post-card ${isDeleting ? 'deleting' : ''}`}>
                <div className="fb-post-header">
                  <div className="fb-post-author">
                    <Link to={`/profile/${post.author.id}`} className="fb-profile-link">
                      <div className="fb-profile-pic-container">
                        {postAuthorPicture ? (
                          <img 
                            src={`http://localhost:3001/uploads/profile-pictures/${postAuthorPicture}`}
                            alt={post.author.username || 'User'}
                            className="fb-post-avatar"
                            onError={(e) => {
                              console.error('Erreur chargement image post author:', e.target.src);
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                            onLoad={(e) => {
                              const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                              if (placeholder) {
                                placeholder.style.display = 'none';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="fb-profile-avatar-placeholder"
                          style={{ display: postAuthorPicture ? 'none' : 'flex' }}
                        >
                          {post.author.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                    </Link>
                    <div className="fb-post-author-info">
                      <strong>{postAuthorName}</strong>
                      <span className="fb-post-date">{formatDate(post.createdAt || post.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Menu d'options du post */}
                  {canEditPost(post) && (
                    <div className="fb-post-options">
                      <button
                        onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
                        className="fb-post-options-btn"
                        disabled={isDeleting}
                      >
                        <MoreHorizontal className="fb-post-options-icon" />
                      </button>
                      
                      {showDropdown === post.id && (
                        <div className="fb-post-dropdown">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="fb-dropdown-item"
                            disabled={isDeleting}
                          >
                            <Edit3 className="fb-dropdown-icon" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="fb-dropdown-item fb-dropdown-item-danger"
                            disabled={isDeleting}
                          >
                            <Trash2 className="fb-dropdown-icon" />
                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Contenu du post */}
                {isEditing ? (
                  <div className="fb-edit-form">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="fb-edit-textarea"
                      placeholder="Modifier votre publication..."
                      rows="3"
                    />
                    
                    {/* Prévisualisation de l'image en édition */}
                    {editImagePreview && (
                      <div className="fb-image-preview-container">
                        <img 
                          src={editImagePreview} 
                          alt="Aperçu" 
                          className="fb-image-preview"
                        />
                        <button
                          onClick={removeEditImage}
                          className="fb-remove-image-btn"
                          type="button"
                        >
                          <X className="fb-remove-image-icon" />
                        </button>
                      </div>
                    )}

                    {/* Actions d'édition */}
                    <div className="fb-edit-actions">
                      <label
                        htmlFor={`editImageInput-${post.id}`}
                        className="fb-upload-btn"
                        title="Modifier l'image"
                      >
                        <input 
                          type="file"
                          id={`editImageInput-${post.id}`}
                          accept="image/*"
                          onChange={handleEditImageSelect}
                          className="fb-file-input"
                        />
                        📷
                      </label>

                      <div className="fb-edit-buttons">
                        <button
                          onClick={handleCancelEdit}
                          className="fb-secondary-btn"
                          disabled={isUpdating}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="fb-primary-btn"
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="fb-post-content">
                      <p className="fb-post-text">{post.content}</p>
                      {post.image && (
                        <div className="fb-post-image-container">
                          <img 
                            src={`http://localhost:3001/uploads/posts/${post.image}`}
                            alt="Publication"
                            className="fb-post-image"
                            onError={(e) => {
                              console.error('Erreur chargement image post:', e.target.src);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions du post */}
                    {/* Section mise à jour des actions du post avec la section commentaires */}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderTop: '1px solid #3a3b3c',
                      marginTop: '12px'
                    }}>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`fb-post-action ${post.user_liked ? 'liked' : ''}`}
                        disabled={isDeleting}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'none',
                          border: 'none',
                          color: post.user_liked ? '#1877f2' : '#b0b3b8',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: isDeleting ? 'default' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          opacity: isDeleting ? 0.6 : 1
                        }}
                      >
                        <ThumbsUp style={{
                          width: '16px',
                          height: '16px',
                          fill: post.user_liked ? '#1877f2' : 'currentColor'
                        }} />
                        <span>{post.likes_count || 0}</span>
                      </button>

                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="fb-post-action" 
                        disabled={isDeleting}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#b0b3b8',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: isDeleting ? 'default' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          opacity: isDeleting ? 0.6 : 1
                        }}
                      >
                        <MessageCircle style={{
                          width: '16px',
                          height: '16px'
                        }} />
                        <span>Commenter</span>
                      </button>

                      <button 
                        className="fb-post-action" 
                        disabled={isDeleting}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#b0b3b8',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: isDeleting ? 'default' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          opacity: isDeleting ? 0.6 : 1
                        }}
                      >
                        <Share style={{
                          width: '16px',
                          height: '16px'
                        }} />
                        <span>Partager</span>
                      </button>
                    </div>

                    {/* NOUVELLE SECTION : Commentaires */}
                    {renderCommentsSection(post)}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );

 // Remplacer la fonction renderAmisContent par cette implementation complète et corrigée
const renderAmisContent = () => (
  <div className="fb-friends-page">
    {/* Section demandes d'amis reçues */}
    {friendRequests.length > 0 && (
      <div className="fb-friends-section">
        <h2 className="fb-section-title">
          Demandes d'amis ({friendRequests.length})
        </h2>
        <div className="fb-friends-grid">
          {friendRequests.map(request => {
            const requesterProfilePicture = getProfilePicture(request.requester);
            const isProcessing = processingRequest === request.id;
            
            return (
              <div key={request.id} className="fb-friend-card">
                <div className="fb-friend-card-header">
                  <div className="fb-friend-avatar-container">
                    {requesterProfilePicture ? (
                      <img 
                        src={`http://localhost:3001/uploads/profile-pictures/${requesterProfilePicture}`}
                        alt={request.requester.username}
                        className="fb-friend-card-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="fb-profile-avatar-placeholder fb-friend-card-avatar"
                      style={{ display: requesterProfilePicture ? 'none' : 'flex' }}
                    >
                      {request.requester.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>
                
                <div className="fb-friend-card-content">
                  <h3 className="fb-friend-card-name">
                    {getFullName(request.requester)}
                  </h3>
                  <p className="fb-friend-card-mutual">
                    {request.mutual_friends > 0 
                      ? `${request.mutual_friends} ami${request.mutual_friends > 1 ? 's' : ''} en commun`
                      : 'Aucun ami en commun'
                    }
                  </p>
                  <p className="fb-friend-card-date">
                    Demande reçue
                  </p>
                </div>

                <div className="fb-friend-card-actions">
                  <button
                    onClick={() => handleFriendRequest(request.id, 'accept')}
                    className="fb-friend-card-btn fb-friend-accept-btn"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Traitement...' : 'Accepter'}
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, 'decline')}
                    className="fb-friend-card-btn fb-friend-decline-btn"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Traitement...' : 'Refuser'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Section suggestions d'amis */}
    {suggestions.length > 0 && (
      <div className="fb-friends-section">
        <h2 className="fb-section-title">
          Personnes que vous pourriez connaître
        </h2>
        <div className="fb-friends-grid">
          {suggestions.map(suggestion => {
            const suggestionProfilePicture = getProfilePicture(suggestion);
            const isSending = sendingRequest === suggestion.id;
            
            return (
              <div key={suggestion.id} className="fb-friend-card">
                <div className="fb-friend-card-header">
                  <div className="fb-friend-avatar-container">
                    {suggestionProfilePicture ? (
                      <img 
                        src={`http://localhost:3001/uploads/profile-pictures/${suggestionProfilePicture}`}
                        alt={suggestion.username}
                        className="fb-friend-card-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="fb-profile-avatar-placeholder fb-friend-card-avatar"
                      style={{ display: suggestionProfilePicture ? 'none' : 'flex' }}
                    >
                      {suggestion.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  
                  {/* Bouton supprimer suggestion */}
                  <button
                    onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                    className="fb-friend-remove-suggestion"
                    disabled={isSending}
                    title="Supprimer cette suggestion"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="fb-friend-card-content">
                  <h3 className="fb-friend-card-name">
                    {getFullName(suggestion)}
                  </h3>
                  <p className="fb-friend-card-mutual">
                    {suggestion.mutual_friends > 0 
                      ? `${suggestion.mutual_friends} ami${suggestion.mutual_friends > 1 ? 's' : ''} en commun`
                      : 'Suggestion pour vous'
                    }
                  </p>
                </div>

                <div className="fb-friend-card-actions">
                  <button
                    onClick={() => handleAddFriend(suggestion.id)}
                    className="fb-friend-card-btn fb-friend-add-btn"
                    disabled={isSending}
                  >
                    <UserPlus size={16} />
                    {isSending ? 'Envoi...' : 'Ajouter'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Section tous les amis - VERSION SIMPLIFIÉE ET CORRIGÉE */}
    <div className="fb-friends-section">
      <div className="fb-section-header">
        <h2 className="fb-section-title">
          Tous les amis {friends.length > 0 && `(${friends.length})`}
        </h2>
        <div className="fb-friends-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Rechercher vos amis..." 
            className="fb-friends-search-input"
            value={searchTerm}
            onChange={(e) => handleSearchFriends(e.target.value)}
          />
        </div>
      </div>
      
      {loadingFriends ? (
        <div className="fb-loading-container">
          <div className="fb-loading-spinner"></div>
          <p>Chargement de vos amis...</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="fb-empty-state">
          <Users size={48} className="fb-empty-icon" />
          {searchTerm ? (
            <>
              <h3>Aucun ami trouvé</h3>
              <p>Aucun ami ne correspond à votre recherche "{searchTerm}"</p>
              <button 
                onClick={() => handleSearchFriends('')}
                className="fb-clear-search-btn"
              >
                Effacer la recherche
              </button>
            </>
          ) : (
            <>
              <h3>Aucun ami pour le moment</h3>
              <p>Commencez à ajouter des amis pour voir votre liste ici.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Statistiques simplifiées */}
          <div className="fb-friends-stats">
            <span className="fb-friends-count">
              {filteredFriends.length} ami{filteredFriends.length > 1 ? 's' : ''}
              {searchTerm && ` trouvé${filteredFriends.length > 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="fb-friends-grid">
            {filteredFriends.map(friend => {
              const friendProfilePicture = getProfilePicture(friend);
              
              return (
                <div key={friend.id} className="fb-friend-card">
                  <div className="fb-friend-card-header">
                    <div className="fb-friend-avatar-container">
                      {friendProfilePicture ? (
                        <img 
                          src={`http://localhost:3001/uploads/profile-pictures/${friendProfilePicture}`}
                          alt={friend.username}
                          className="fb-friend-card-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="fb-profile-avatar-placeholder fb-friend-card-avatar"
                        style={{ display: friendProfilePicture ? 'none' : 'flex' }}
                      >
                        {friend.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="fb-friend-card-content">
                    <h3 className="fb-friend-card-name">
                      {getFullName(friend)}
                    </h3>
                    <p className="fb-friend-card-status">
                      {friend.username}
                    </p>
                    <p className="fb-friend-card-since">
                      Ami accepté
                    </p>
                  </div>

                  <div className="fb-friend-card-actions">
                    <button 
                      onClick={() => handleSendMessage(friend.id)}
                      className="fb-friend-card-btn fb-friend-message-btn"
                    >
                      <MessageCircle size={16} />
                      Message
                    </button>
                    <button 
                      onClick={() => handleMoreOptions(friend.id)}
                      className="fb-friend-card-btn fb-friend-more-btn"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>

    {/* État de chargement global */}
    {loadingFriends && friendRequests.length === 0 && suggestions.length === 0 && friends.length === 0 && (
      <div className="fb-loading-container">
        <div className="fb-loading-spinner"></div>
        <p>Chargement des données d'amis...</p>
      </div>
    )}
  </div>
);

// Votre fonction renderNotificationsContent mise à jour
const renderNotificationsContent = () => {
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <div className="fb-notifications-page">
      <div className="fb-notifications-header">
        <h2 className="fb-page-title">Notifications</h2>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="fb-mark-all-read-btn"
          >
            <CheckCheck size={16} />
            Tout marquer comme lu ({unreadCount})
          </button>
        )}
      </div>
      
      {/* Filtres */}
      <div className="fb-notifications-filters">
        <button 
          className={`fb-filter-btn ${notificationFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setNotificationFilter('all');
            fetchNotifications('all');
          }}
        >
          Toutes ({notifications.length})
        </button>
        <button 
          className={`fb-filter-btn ${notificationFilter === 'unread' ? 'active' : ''}`}
          onClick={() => {
            setNotificationFilter('unread');
            fetchNotifications('unread');
          }}
        >
          Non lues ({notifications.filter(n => !n.is_read).length})
        </button>
        <button 
          className={`fb-filter-btn ${notificationFilter === 'friends' ? 'active' : ''}`}
          onClick={() => {
            setNotificationFilter('friends');
            fetchNotifications('friends');
          }}
        >
          Amis
        </button>
        <button 
          className={`fb-filter-btn ${notificationFilter === 'likes' ? 'active' : ''}`}
          onClick={() => {
            setNotificationFilter('likes');
            fetchNotifications('likes');
          }}
        >
          J'aime
        </button>
        <button 
          className={`fb-filter-btn ${notificationFilter === 'comments' ? 'active' : ''}`}
          onClick={() => {
            setNotificationFilter('comments');
            fetchNotifications('comments');
          }}
        >
          Commentaires
        </button>
        <button 
          className={`fb-filter-btn ${notificationFilter === 'birthdays' ? 'active' : ''}`}
          onClick={() => {
            setNotificationFilter('birthdays');
            fetchNotifications('birthdays');
          }}
        >
          Anniversaires
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="fb-notifications-list">
        {loadingNotifications ? (
          <div className="fb-loading-container">
            <div className="fb-loading-spinner"></div>
            <p>Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="fb-empty-notifications">
            <Bell size={48} className="fb-empty-icon" />
            <h3>Aucune notification</h3>
            <p>
              {notificationFilter === 'all' 
                ? "Vous n'avez aucune notification pour le moment."
                : `Aucune notification dans la catégorie "${notificationFilter}".`
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const actorPicture = getProfilePicture(notification.actor);
            const isUnread = !notification.is_read;
            const isMarking = markingAsRead === notification.id;
            
            return (
              <div 
                key={notification.id} 
                className={`fb-notification-item ${isUnread ? 'unread' : 'read'}`}
              >
                <div className="fb-notification-content">
                  {/* Avatar */}
                  <div className="fb-notification-avatar">
                    {actorPicture ? (
                      <img 
                        src={`http://localhost:3001/uploads/profile-pictures/${actorPicture}`}
                        alt={notification.actor?.username || 'User'}
                        className="fb-notification-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="fb-profile-avatar-placeholder fb-notification-avatar-img"
                      style={{ display: actorPicture ? 'none' : 'flex' }}
                    >
                      {notification.actor?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    
                    {/* Icône du type de notification */}
                    <div className="fb-notification-type-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Contenu principal */}
                  <div className="fb-notification-main">
                    <div className="fb-notification-text">
                      <p className="fb-notification-message">
                        {getNotificationMessage(notification)}
                      </p>
                      <span className="fb-notification-time">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>

                    {/* Prévisualisation si c'est lié à un post */}
                    {notification.post && (
                      <div className="fb-notification-preview">
                        {notification.post.image && (
                          <img 
                            src={`http://localhost:3001/uploads/posts/${notification.post.image}`}
                            alt="Publication"
                            className="fb-notification-preview-img"
                          />
                        )}
                        {notification.post.content && (
                          <p className="fb-notification-preview-text">
                            {notification.post.content.length > 50 
                              ? `${notification.post.content.substring(0, 50)}...`
                              : notification.post.content
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="fb-notification-actions">
                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="fb-notification-action-btn"
                        disabled={isMarking}
                        title="Marquer comme lu"
                      >
                        {isMarking ? (
                          <div className="fb-mini-spinner"></div>
                        ) : (
                          <Check size={16} />
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="fb-notification-action-btn fb-notification-delete-btn"
                      title="Supprimer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Indicateur non lu */}
                {isUnread && (
                  <div className="fb-notification-unread-indicator"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// MAINTENANT LA FONCTION renderMessagesContent DEVIENT SIMPLE (sans hooks)
  const renderMessagesContent = () => {
    return (
      <div className="fb-messages-page">
        <div className="fb-messages-layout">
          {/* Sidebar conversations */}
          <div className="fb-conversations-sidebar">
            <div className="fb-messages-header">
              <h2>Messages</h2>
              <button className="fb-new-message-btn">Nouveau message</button>
            </div>
            
            <div className="fb-conversations-list">
              {loadingMessages ? (
                <div className="fb-loading-messages">
                  <p>Chargement des conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="fb-no-conversations">
                  <p>Aucune conversation</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const friendProfilePicture = getProfilePicture(conv.friend);
                  
                  return (
                    <div 
                      key={conv.id} 
                      className={`fb-conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                      onClick={() => setSelectedConversation({
                        ...conv,
                        messages: generateMockMessages(conv.friend)
                      })}
                    >
                      <div className="fb-conversation-avatar">
                        {friendProfilePicture ? (
                          <img 
                            src={`http://localhost:3001/uploads/profile-pictures/${friendProfilePicture}`}
                            alt={conv.friend.username}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="fb-profile-avatar-placeholder"
                          style={{ display: friendProfilePicture ? 'none' : 'flex' }}
                        >
                          {conv.friend.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      
                      <div className="fb-conversation-details">
                        <h3>{getFullName(conv.friend)}</h3>
                        <p className="fb-conversation-preview">{conv.lastMessage}</p>
                        <span className="fb-conversation-date">{formatDate(conv.lastMessageDate)}</span>
                      </div>
                      
                      {conv.unreadCount > 0 && (
                        <span className="fb-conversation-unread">{conv.unreadCount}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div className="fb-chat-area">
            {selectedConversation ? (
              <>
                <div className="fb-chat-header">
                  <div className="fb-chat-user">
                    <div className="fb-chat-avatar">
                      {getProfilePicture(selectedConversation.friend) ? (
                        <img 
                          src={`http://localhost:3001/uploads/profile-pictures/${getProfilePicture(selectedConversation.friend)}`}
                          alt={selectedConversation.friend.username}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="fb-profile-avatar-placeholder"
                        style={{ display: getProfilePicture(selectedConversation.friend) ? 'none' : 'flex' }}
                      >
                        {selectedConversation.friend.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    <h2>{getFullName(selectedConversation.friend)}</h2>
                  </div>
                  <div className="fb-chat-actions">
                    <button className="fb-chat-action-btn">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="fb-messages-container">
                  {selectedConversation.messages?.length > 0 ? (
                    selectedConversation.messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`fb-message ${msg.sender.id === user.id ? 'sent' : 'received'}`}
                      >
                        <div className="fb-message-content">
                          <p>{msg.content}</p>
                          <span className="fb-message-time">{formatDate(msg.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="fb-no-messages">
                      <p>Pas de messages dans cette conversation</p>
                    </div>
                  )}
                </div>
                
                <div className="fb-message-input-container">
                  <textarea
                    placeholder="Écrivez un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            ) : (
              <div className="fb-select-conversation">
                <Mail size={48} className="fb-empty-icon" />
                <h3>Sélectionnez une conversation</h3>
                <p>Choisissez une conversation existante ou démarrez-en une nouvelle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

// Fonction pour générer des messages fictifs
  const generateMockMessages = (friend) => {
    const messages = [];
    const count = Math.floor(Math.random() * 10) + 3;
    
    for (let i = 0; i < count; i++) {
      const isUser = Math.random() > 0.5;
      messages.push({
        id: Date.now() + i,
        content: isUser 
          ? `Salut ${friend.firstName || friend.first_name || friend.username}, comment ça va ?`
          : `Bonjour ${user.firstName || user.first_name || user.username}, je vais bien merci !`,
        sender: isUser ? user : friend,
        createdAt: new Date(Date.now() - (count - i) * 1000 * 60 * 60).toISOString()
      });
    }
    
    return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  // Fermer le dropdown et le mode édition quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.fb-post-options') && !event.target.closest('.fb-edit-form')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Charger les notifications
useEffect(() => {
  const fetchNotifications = async () => {
    if (!user || !token || currentPage !== 'notifications') return;

    try {
      setLoadingNotifications(true);
      
      const response = await fetch('http://localhost:3001/api/notifications', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  if (currentPage === 'notifications') {
    fetchNotifications();
  }
}, [user, token, currentPage]);

  // Charger les posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/posts', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const data = await response.json();
        console.log('Posts data received:', data);
        setPosts(Array.isArray(data) ? data : data.posts || []);
      } catch (error) {
        console.error('Fetch posts error:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchPosts();
    }
  }, [user, token]);

  // Ajoutez ce useEffect après les autres pour récupérer la liste des amis
useEffect(() => {
  const fetchFriends = async () => {
    if (!user || !token || currentPage !== 'amis') return;

    try {
      const response = await fetch('http://localhost:3001/api/friends/list', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const friendsData = await response.json();
        console.log('Friends list received:', friendsData);
        setFriends(friendsData);
      } else {
        console.error('Failed to fetch friends list');
      }

    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Charger les amis seulement quand on est sur la page amis
  if (currentPage === 'amis') {
    fetchFriends();
  }
}, [user, token, currentPage]);

// Fonction useEffect pour charger les amis au démarrage
useEffect(() => {
  // Charger les amis acceptés quand le composant se monte
  if (user) {
    fetchAcceptedFriends();
  }
}, [user]); // Se déclenche quand l'utilisateur change

// Fonction pour rafraîchir la liste des amis (utile après acceptation d'une demande)
const refreshFriends = () => {
  fetchAcceptedFriends();
};

  // Charger les demandes d'amis et suggestions
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!user || !token) return;

      try {
        setLoadingFriends(true);

        // Récupérer les demandes d'amis reçues
        const requestsResponse = await fetch('http://localhost:3001/api/friends/requests', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          console.log('Friend requests received:', requestsData);
          setFriendRequests(requestsData);
        } else {
          console.error('Failed to fetch friend requests');
        }

        // Récupérer les suggestions d'amis
        const suggestionsResponse = await fetch('http://localhost:3001/api/friends/suggestions?limit=5', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          console.log('Friend suggestions received:', suggestionsData);
          setSuggestions(suggestionsData);
        } else {
          console.error('Failed to fetch friend suggestions');
        }

      } catch (error) {
        console.error('Error fetching friends data:', error);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriendsData();
  }, [user, token]);

  // Hook useEffect pour charger les notifications (à ajouter avec vos autres useEffect)
useEffect(() => {
  if (currentPage === 'notifications') {
    fetchNotifications();
  }
}, [currentPage]);

  // Charger les conversations (amis avec qui discuter)
  useEffect(() => {
    const loadConversations = async () => {
      if (currentPage !== 'messages') return;
      
      try {
        setLoadingMessages(true);
        
        // Récupérer la liste des amis
        const response = await fetch('http://localhost:3001/api/friends', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const friends = await response.json();
          
          // Créer des conversations fictives avec les amis
          const mockConversations = friends.map(friend => ({
            id: friend.id,
            friend,
            lastMessage: `Dernier message avec ${getFullName(friend)}`,
            lastMessageDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
            unreadCount: Math.floor(Math.random() * 5)
          }));
          
          setConversations(mockConversations);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadConversations();
  }, [currentPage, token]); // Supprimez la dépendance problématique

  const handleNewPost = async () => {
    if (!newPost.trim() && !selectedImage) {
      setError("Veuillez écrire quelque chose ou ajouter une image");
      return;
    }

    setIsPosting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('content', newPost.trim());
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la publication");
      }

      const data = await response.json();
      console.log('New post created:', data);
      
      setPosts(prevPosts => [data.post, ...prevPosts]);
      setNewPost("");
      removeImage();

    } catch (error) {
      setError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Veuillez sélectionner une image valide");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('imageInput');
    if (fileInput) fileInput.value = '';
  };

  // Gestion des images pour la modification
  const handleEditImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Veuillez sélectionner une image valide");
        return;
      }
      setEditImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setEditImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const removeEditImage = () => {
    setEditImage(null);
    setEditImagePreview(null);
    const fileInput = document.getElementById(`editImageInput-${editingPost}`);
    if (fileInput) fileInput.value = '';
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                user_liked: data.liked,
                likes_count: data.liked ? post.likes_count + 1 : post.likes_count - 1
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Fonction pour démarrer la modification d'un post
  const handleEditPost = (post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setEditImagePreview(post.image ? `http://localhost:3001/uploads/posts/${post.image}` : null);
    setEditImage(null);
    setShowDropdown(null);
    setError("");
  };

  // Fonction pour annuler la modification
  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
    setEditImage(null);
    setEditImagePreview(null);
    setError("");
  };

  // Fonction pour sauvegarder la modification
  const handleSaveEdit = async () => {
    if (!editContent.trim() && !editImage && !editImagePreview) {
      setError("Veuillez écrire quelque chose ou ajouter une image");
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('content', editContent.trim());
      
      if (editImage) {
        formData.append('image', editImage);
      }

      const response = await fetch(`http://localhost:3001/api/posts/${editingPost}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la modification");
      }

      const data = await response.json();
      console.log('Post updated:', data);
      
      // Mettre à jour le post dans la liste
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editingPost ? data.post : post
        )
      );
      
      // Réinitialiser l'état d'édition
      handleCancelEdit();

    } catch (error) {
      setError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Fonction pour supprimer un post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      return;
    }

    setDeletingPost(postId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      const data = await response.json();
      
      if (data.success) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        console.log('Post supprimé avec succès');
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError(error.message);
      
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeletingPost(null);
      setShowDropdown(null);
    }
  };

  // Fonction pour vérifier si l'utilisateur peut modifier/supprimer le post
  const canEditPost = (post) => {
    return user && post && (post.author_id === user.id || post.author_id === user.userId);
  };

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  
  return date.toLocaleDateString('fr-FR');
};
  // Fonction pour gérer les demandes d'amis (accepter/refuser)
  const handleFriendRequest = async (requestId, action) => {
    try {
      setProcessingRequest(requestId);
      
      const endpoint = action === 'accept' 
        ? `http://localhost:3001/api/friends/accept/${requestId}`
        : `http://localhost:3001/api/friends/decline/${requestId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Supprimer la demande de la liste
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        
        const data = await response.json();
        console.log(`Demande d'ami ${action === 'accept' ? 'acceptée' : 'refusée'}:`, data);
        
        // Si acceptée, on pourrait rafraîchir les suggestions pour éviter les doublons
        if (action === 'accept') {
          // Optionnel: recharger les suggestions
          const suggestionsResponse = await fetch('http://localhost:3001/api/friends/suggestions?limit=5', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (suggestionsResponse.ok) {
            const suggestionsData = await suggestionsResponse.json();
            setSuggestions(suggestionsData);
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Erreur lors du ${action === 'accept' ? 'acceptation' : 'refus'}`);
      }
    } catch (error) {
      console.error(`Erreur ${action} demande d'ami:`, error);
      setError(`Erreur lors du ${action === 'accept' ? 'acceptation' : 'refus'} de la demande`);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Fonction pour envoyer une demande d'ami
  const handleAddFriend = async (userId) => {
    try {
      setSendingRequest(userId);
      
      const response = await fetch('http://localhost:3001/api/friends/request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Demande d\'ami envoyée:', data);
        
        // Supprimer l'utilisateur des suggestions
        setSuggestions(prev => prev.filter(sug => sug.id !== userId));
        
        // Optionnel: afficher un message de succès
        setError(""); // Clear any previous errors
        
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur envoi demande d\'ami:', error);
      setError('Erreur lors de l\'envoi de la demande d\'ami');
    } finally {
      setSendingRequest(null);
    }
  };

const handleMarkAsRead = async (notificationId) => {
  setMarkingAsRead(notificationId);
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
  } finally {
    setMarkingAsRead(null);
  }
};

const handleMarkAllAsRead = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:3001/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
  }
};


// Simuler l'envoi d'un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      
      // Simulation d'envoi
      const newMsg = {
        id: Date.now(),
        content: newMessage,
        sender: user,
        createdAt: new Date().toISOString()
      };

      // Mettre à jour la conversation sélectionnée
      setSelectedConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg]
      }));

      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  }
};

const getFilteredNotifications = () => {
  switch (notificationFilter) {
    case 'unread':
      return notifications.filter(n => !n.is_read);
    case 'friends':
      return notifications.filter(n => ['friend_request', 'friend_accepted'].includes(n.type));
    case 'likes':
      return notifications.filter(n => n.type === 'like');
    case 'comments':
      return notifications.filter(n => ['comment', 'reply'].includes(n.type));
    case 'birthdays':
      return notifications.filter(n => n.type === 'birthday');
    default:
      return notifications;
  }
};

if (!user) {
  return (
    <div className="fb-public-container">
      <div className="fb-public-content">
        <img src="Gemini_Generated_Image_2e2a6p2e2a6p2e2a.png" alt="Logo Facebook" className="fb-logo" />
        <h2>Bienvenue sur Facebook</h2>
        <p>Connectez-vous pour voir les publications de vos amis.</p>
        <div className="fb-auth-actions">
          <Link to="/login" className="fb-primary-btn">Se connecter</Link>
          <Link to="/register" className="fb-secondary-btn">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}

  console.log('Current user data:', user);

  const userProfilePicture = getProfilePicture(user);

  return (
    <div className="fb-container">
      {/* Header */}
      <header className="fb-header">
        <div className="fb-header-content">
          <div className="fb-header-left">
            <div className="fb-search">
              <Search className="fb-search-icon" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="fb-search-input"
              />
            </div>
          </div>
          
          {/* Navigation avec gestion des clics */}
          <nav className="fb-nav">
            <button 
              className={`fb-nav-button ${currentPage === 'accueil' ? 'active' : ''}`}
              onClick={() => setCurrentPage('accueil')}
            >
              <Home className="fb-nav-icon" />
            </button>
            <button 
              className={`fb-nav-button ${currentPage === 'amis' ? 'active' : ''}`}
              onClick={() => setCurrentPage('amis')}
            >
              <Users className="fb-nav-icon" />
            </button>
            <button 
              className={`fb-nav-button fb-nav-button-notification ${currentPage === 'notifications' ? 'active' : ''}`}
              onClick={() => setCurrentPage('notifications')}
            >
              <Bell className="fb-nav-icon" />
              {unreadCount > 0 && (
                <span className="fb-notification-badge">{unreadCount}</span>
              )}
            </button>
            <button 
              className={`fb-nav-button fb-nav-button-notification ${currentPage === 'messages' ? 'active' : ''}`}
              onClick={() => setCurrentPage('messages')}
            >
              <Mail className="fb-nav-icon" />
              <span className="fb-notification-badge">1</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="fb-grid">
        {/* Sidebar gauche */}
        <div className="fb-left-sidebar">
          <div className="fb-sidebar-card">
            <div className="fb-profile-card">
              <Link to="/profile" className="fb-profile-link">
                <div className="fb-profile-pic-container">
                  {userProfilePicture ? (
                    <img 
                      src={`http://localhost:3001/uploads/profile-pictures/${userProfilePicture}`}
                      alt={`Profil de ${user.username}`}
                      className="fb-profile-avatar"
                      onError={(e) => {
                        console.error('Erreur chargement image sidebar:', e.target.src);
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                      onLoad={(e) => {
                        const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                        if (placeholder) {
                          placeholder.style.display = 'none';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="fb-profile-avatar-placeholder"
                    style={{ display: userProfilePicture ? 'none' : 'flex' }}
                  >
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="fb-profile-name">{getFullName(user)}</h3>
                  <p className="fb-profile-link-text">Voir votre profil</p>
                </div>
              </Link>
            </div>
            <nav className="fb-sidebar-nav">
              <Link to="/friends" className="fb-sidebar-link">
                <Users className="fb-sidebar-icon fb-sidebar-icon-friends" />
                <span>Amis</span>
              </Link>
              <Link to="/groups" className="fb-sidebar-link">
                <Users className="fb-sidebar-icon fb-sidebar-icon-groups" />
                <span>Groupes</span>
              </Link>
              <Link to="/watch" className="fb-sidebar-link">
                <Users className="fb-sidebar-icon fb-sidebar-icon-watch" />
                <span>Watch</span>
              </Link>
              <Link to="/settings" className="fb-sidebar-link">
                <Users className="fb-sidebar-icon fb-sidebar-icon-settings" />
                <span>Paramètres</span>
              </Link>
            </nav>
          </div>

          {/* Demandes d'amis */}
          {friendRequests.length > 0 && (
            <div className="fb-sidebar-card">
              <h3 className="fb-sidebar-title">Demandes d'amis ({friendRequests.length})</h3>
              {loadingFriends ? (
                <p className="fb-loading-text">Chargement...</p>
              ) : (
                friendRequests.map(request => {
                  const requesterProfilePicture = getProfilePicture(request.requester);
                  const isProcessing = processingRequest === request.id;
                  
                  return (
                    <div key={request.id} className="fb-friend-request">
                      <div className="fb-friend-info">
                        <div className="fb-profile-pic-container">
                          {requesterProfilePicture ? (
                            <img 
                              src={`http://localhost:3001/uploads/profile-pictures/${requesterProfilePicture}`}
                              alt={request.requester.username}
                              className="fb-friend-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className="fb-profile-avatar-placeholder fb-friend-avatar"
                            style={{ display: requesterProfilePicture ? 'none' : 'flex' }}
                          >
                            {request.requester.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        </div>
                        <div>
                          <p className="fb-friend-name">{getFullName(request.requester)}</p>
                          <p className="fb-friend-mutual">
                            {request.mutual_friends > 0 
                              ? `${request.mutual_friends} amis en commun`
                              : 'Aucun ami en commun'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="fb-friend-actions">
                        <button
                          onClick={() => handleFriendRequest(request.id, 'accept')}
                          className="fb-friend-accept"
                          disabled={isProcessing}
                          title="Accepter"
                        >
                          <ThumbsUp className="fb-friend-action-icon" />
                        </button>
                        <button
                          onClick={() => handleFriendRequest(request.id, 'decline')}
                          className="fb-friend-decline"
                          disabled={isProcessing}
                          title="Refuser"
                        >
                          <X className="fb-friend-action-icon" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Contenu principal - Affichage conditionnel selon la page active */}
        <div className="fb-main-content">
          {renderCurrentPage()}
        </div>

        {/* Sidebar droite */}
        <div className="fb-right-sidebar">
          {/* Suggestions d'amis */}
          {suggestions.length > 0 && (
            <div className="fb-sidebar-card">
              <h3 className="fb-sidebar-title">Suggestions d'amis</h3>
              {loadingFriends ? (
                <p className="fb-loading-text">Chargement...</p>
              ) : (
                suggestions.map(suggestion => {
                  const suggestionProfilePicture = getProfilePicture(suggestion);
                  const isSending = sendingRequest === suggestion.id;
                  
                  return (
                    <div key={suggestion.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: '1px solid #3e4042'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: '1'
                      }}>
                        <div style={{
                          position: 'relative',
                          marginRight: '12px'
                        }}>
                          {suggestionProfilePicture ? (
                            <img 
                              src={`http://localhost:3001/uploads/profile-pictures/${suggestionProfilePicture}`}
                              alt={suggestion.username}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentNode.querySelector('.fb-profile-avatar-placeholder');
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className="fb-profile-avatar-placeholder"
                            style={{ 
                              display: suggestionProfilePicture ? 'none' : 'flex',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#1877f2',
                              color: 'white',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}
                          >
                            {suggestion.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        </div>
                        <div>
                          <p style={{
                            color: '#e4e6ea',
                            fontSize: '14px',
                            fontWeight: '600',
                            margin: '0 0 4px 0'
                          }}>{getFullName(suggestion)}</p>
                          <p style={{
                            color: '#b0b3b8',
                            fontSize: '12px',
                            margin: '0'
                          }}>
                            {suggestion.mutual_friends > 0 
                              ? `${suggestion.mutual_friends} amis en commun`
                              : 'Suggestion pour vous'
                            }
                          </p>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => handleAddFriend(suggestion.id)}
                          disabled={isSending}
                          title="Ajouter en ami"
                          style={{
                            backgroundColor: '#1877f2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: isSending ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            opacity: isSending ? '0.6' : '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '32px',
                            height: '32px'
                          }}
                        >
                          {isSending ? (
                            '...'
                          ) : (
                            <UserPlus size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                          disabled={isSending}
                          title="Supprimer la suggestion"
                          style={{
                            backgroundColor: '#4e4f50',
                            color: '#b0b3b8',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: isSending ? 'not-allowed' : 'pointer',
                            opacity: isSending ? '0.6' : '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '32px',
                            height: '32px'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Activités récentes */}
          <div className="fb-sidebar-card">
            <h3 className="fb-sidebar-title">Activité récente</h3>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #3e4042'
              }}>
                <div style={{
                  fontSize: '20px',
                  marginRight: '12px',
                  minWidth: '24px'
                }}>👍</div>
                <div style={{ flex: '1' }}>
                  <p style={{
                    color: '#e4e6ea',
                    fontSize: '14px',
                    margin: '0 0 4px 0',
                    lineHeight: '1.3'
                  }}>Marie a aimé votre publication</p>
                  <span style={{
                    color: '#b0b3b8',
                    fontSize: '12px'
                  }}>il y a 2h</span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #3e4042'
              }}>
                <div style={{
                  fontSize: '20px',
                  marginRight: '12px',
                  minWidth: '24px'
                }}>💬</div>
                <div style={{ flex: '1' }}>
                  <p style={{
                    color: '#e4e6ea',
                    fontSize: '14px',
                    margin: '0 0 4px 0',
                    lineHeight: '1.3'
                  }}>Paul a commenté votre photo</p>
                  <span style={{
                    color: '#b0b3b8',
                    fontSize: '12px'
                  }}>il y a 4h</span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <div style={{
                  fontSize: '20px',
                  marginRight: '12px',
                  minWidth: '24px'
                }}>🎉</div>
                <div style={{ flex: '1' }}>
                  <p style={{
                    color: '#e4e6ea',
                    fontSize: '14px',
                    margin: '0 0 4px 0',
                    lineHeight: '1.3'
                  }}>C'est l'anniversaire de Sophie aujourd'hui</p>
                  <span style={{
                    color: '#b0b3b8',
                    fontSize: '12px'
                  }}>Aujourd'hui</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts - Liste d'amis */}
          {/* Contacts - Liste d'amis */}
          <div className="fb-sidebar-card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 className="fb-sidebar-title">Contacts ({friends.length})</h3>
              <button
                onClick={refreshFriends}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b0b3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                title="Actualiser la liste"
              >
                🔄
              </button>
            </div>
            
            <div>
              {friends.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#b0b3b8',
                  fontSize: '14px'
                }}>
                  <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Aucun ami</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    Ajoutez des amis pour commencer à discuter
                  </p>
                </div>
              ) : (
                friends.slice(0, 6).map(friend => {
                  const friendProfilePicture = getProfilePicture(friend);
                  const friendName = getFullName(friend);
                  
                  return (
                    <div 
                      key={friend.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 0',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }} 
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4e4f50'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        setCurrentPage('messages');
                        setSelectedConversation({
                          id: friend.id,
                          friend,
                          lastMessage: `Conversation avec ${friendName}`,
                          lastMessageDate: new Date(),
                          unreadCount: 0,
                          messages: generateMockMessages(friend)
                        });
                      }}
                    >
                      <div style={{ position: 'relative', marginRight: '12px' }}>
                        {friendProfilePicture ? (
                          <img 
                            src={`http://localhost:3001/uploads/profile-pictures/${friendProfilePicture}`}
                            alt={friend.username}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="fb-contact-avatar-placeholder"
                          style={{
                            display: friendProfilePicture ? 'none' : 'flex',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#1877f2',
                            color: 'white',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          {friend.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      
                      <span style={{
                        color: '#e4e6ea',
                        fontSize: '14px',
                        fontWeight: '500',
                        flex: 1
                      }}>
                        {friendName}
                      </span>
                    </div>
                  );
                })
              )}
              
              {friends.length > 6 && (
                <div 
                  style={{
                    padding: '8px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s',
                    color: '#1877f2',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4e4f50'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setCurrentPage('amis')}
                >
                  Voir tous les amis ({friends.length})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'erreur globaux */}
      {error && (
        <div className="fb-error-toast">
          <p>{error}</p>
          <button onClick={() => setError("")} className="fb-error-close">
            <X className="fb-error-close-icon" />
          </button>
        </div>
      )}

      {/* Ajout du CSS pour les placeholders des pages */}
      <style jsx>{`
        .fb-page-placeholder {
          background: white;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #65676b;
          font-size: 18px;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default FacebookHomepage;