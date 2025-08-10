import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Users, UserPlus, X, ThumbsUp, MessageCircle, MoreHorizontal, UserMinus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles.css';

const FriendsPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'requests', 'suggestions'
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingRequest, setSendingRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [removingFriend, setRemovingFriend] = useState(null);
  const [error, setError] = useState('');

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

  // Charger toutes les données d'amis
  useEffect(() => {
    const fetchAllFriendsData = async () => {
      if (!user || !token) return;

      try {
        setLoading(true);

        // Récupérer tous les amis
        const friendsResponse = await fetch('http://localhost:3001/api/friends', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData);
        }

        // Récupérer les demandes d'amis reçues
        const requestsResponse = await fetch('http://localhost:3001/api/friends/requests', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setFriendRequests(requestsData);
        }

        // Récupérer les suggestions d'amis
        const suggestionsResponse = await fetch('http://localhost:3001/api/friends/suggestions?limit=20', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          setSuggestions(suggestionsData);
        }

      } catch (error) {
        console.error('Error fetching friends data:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchAllFriendsData();
  }, [user, token]);

  // Gérer les demandes d'amis (accepter/refuser)
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
        
        // Si acceptée, recharger la liste des amis
        if (action === 'accept') {
          const friendsResponse = await fetch('http://localhost:3001/api/friends', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            setFriends(friendsData);
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

  // Envoyer une demande d'ami
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
        // Supprimer l'utilisateur des suggestions
        setSuggestions(prev => prev.filter(sug => sug.id !== userId));
        setError('');
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

  // Supprimer un ami
  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet ami ?')) {
      return;
    }

    try {
      setRemovingFriend(friendId);
      
      const response = await fetch(`http://localhost:3001/api/friends/remove/${friendId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFriends(prev => prev.filter(friend => friend.id !== friendId));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression ami:', error);
      setError('Erreur lors de la suppression de l\'ami');
    } finally {
      setRemovingFriend(null);
    }
  };

  // Filtrer les amis selon le terme de recherche
  const filteredFriends = friends.filter(friend => {
    const fullName = getFullName(friend).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (!user) {
    return (
      <div className="fb-public-container">
        <div className="fb-public-content">
          <h2>Accès restreint</h2>
          <p>Connectez-vous pour voir vos amis.</p>
          <Link to="/login" className="fb-primary-btn">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    
    <div className="fb-container">
      {/* Header simplifié */}
      <header className="fb-header">
        <div className="fb-header-content">
          <div className="fb-header-left">
            <Link to="/" className="fb-logo">facebook</Link>
          </div>
          <nav className="fb-nav">
            <Link to="/" className="fb-nav-button">
              <Users className="fb-nav-icon" />
            </Link>
          </nav>
        </div>
      </header>

      <div className="fb-friends-container">
        <div className="fb-friends-header">
          <h1 className="fb-friends-title">Amis</h1>
          
          {/* Barre de recherche */}
          <div className="fb-friends-search">
            <Search className="fb-search-icon" />
            <input
              type="text"
              placeholder="Rechercher des amis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fb-search-input"
            />
          </div>
        </div>

        {/* Onglets */}
        <div className="fb-friends-tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`fb-friends-tab ${activeTab === 'all' ? 'active' : ''}`}
          >
            Tous les amis ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`fb-friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
          >
            Demandes ({friendRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`fb-friends-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          >
            Suggestions ({suggestions.length})
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        <div className="fb-friends-content">
          {loading ? (
            <div className="fb-loading-container">
              <p>Chargement...</p>
            </div>
          ) : (
            <>
              {/* Tous les amis */}
              {activeTab === 'all' && (
                <div className="fb-friends-grid">
                  {filteredFriends.length === 0 ? (
                    <div className="fb-empty-state">
                      <Users className="fb-empty-icon" />
                      <h3>Aucun ami trouvé</h3>
                      <p>
                        {searchTerm 
                          ? 'Aucun ami ne correspond à votre recherche.'
                          : 'Vous n\'avez pas encore d\'amis. Explorez les suggestions!'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredFriends.map(friend => {
                      const friendProfilePicture = getProfilePicture(friend);
                      const isRemoving = removingFriend === friend.id;
                      
                      return (
                        <div key={friend.id} className="fb-friend-card">
                          <div className="fb-friend-card-header">
                            <div className="fb-profile-pic-container">
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
                          
                          <div className="fb-friend-card-info">
                            <h3 className="fb-friend-card-name">{getFullName(friend)}</h3>
                            <p className="fb-friend-card-mutual">
                              {friend.mutual_friends > 0 
                                ? `${friend.mutual_friends} amis en commun`
                                : 'Ami'
                              }
                            </p>
                          </div>
                          
                          <div className="fb-friend-card-actions">
                            <button
                              className="fb-friend-card-btn fb-friend-card-message"
                              disabled={isRemoving}
                            >
                              <MessageCircle className="fb-friend-card-icon" />
                              Message
                            </button>
                            
                            <div className="fb-friend-card-dropdown">
                              <button
                                className="fb-friend-card-btn fb-friend-card-more"
                                disabled={isRemoving}
                              >
                                <MoreHorizontal className="fb-friend-card-icon" />
                              </button>
                              
                              <div className="fb-friend-card-dropdown-menu">
                                <button
                                  onClick={() => handleRemoveFriend(friend.id)}
                                  className="fb-friend-card-dropdown-item fb-danger"
                                  disabled={isRemoving}
                                >
                                  <UserMinus className="fb-friend-card-dropdown-icon" />
                                  {isRemoving ? 'Suppression...' : 'Supprimer'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Demandes d'amis */}
              {activeTab === 'requests' && (
                <div className="fb-friends-grid">
                  {friendRequests.length === 0 ? (
                    <div className="fb-empty-state">
                      <ThumbsUp className="fb-empty-icon" />
                      <h3>Aucune demande d'ami</h3>
                      <p>Vous n'avez aucune demande d'ami en attente.</p>
                    </div>
                  ) : (
                    friendRequests.map(request => {
                      const requesterProfilePicture = getProfilePicture(request.requester);
                      const isProcessing = processingRequest === request.id;
                      
                      return (
                        <div key={request.id} className="fb-friend-card fb-friend-request-card">
                          <div className="fb-friend-card-header">
                            <div className="fb-profile-pic-container">
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
                          
                          <div className="fb-friend-card-info">
                            <h3 className="fb-friend-card-name">{getFullName(request.requester)}</h3>
                            <p className="fb-friend-card-mutual">
                              {request.mutual_friends > 0 
                                ? `${request.mutual_friends} amis en commun`
                                : 'Aucun ami en commun'
                              }
                            </p>
                            <p className="fb-friend-card-time">
                              Demande reçue {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          
                          <div className="fb-friend-card-actions">
                            <button
                              onClick={() => handleFriendRequest(request.id, 'accept')}
                              className="fb-friend-card-btn fb-friend-card-accept"
                              disabled={isProcessing}
                            >
                              <ThumbsUp className="fb-friend-card-icon" />
                              {isProcessing ? 'Traitement...' : 'Accepter'}
                            </button>
                            <button
                              onClick={() => handleFriendRequest(request.id, 'decline')}
                              className="fb-friend-card-btn fb-friend-card-decline"
                              disabled={isProcessing}
                            >
                              <X className="fb-friend-card-icon" />
                              Refuser
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Suggestions d'amis */}
              {activeTab === 'suggestions' && (
                <div className="fb-friends-grid">
                  {suggestions.length === 0 ? (
                    <div className="fb-empty-state">
                      <UserPlus className="fb-empty-icon" />
                      <h3>Aucune suggestion</h3>
                      <p>Nous n'avons actuellement aucune suggestion d'ami pour vous.</p>
                    </div>
                  ) : (
                    suggestions.map(suggestion => {
                      const suggestionProfilePicture = getProfilePicture(suggestion);
                      const isSending = sendingRequest === suggestion.id;
                      
                      return (
                        <div key={suggestion.id} className="fb-friend-card fb-friend-suggestion-card">
                          <div className="fb-friend-card-header">
                            <div className="fb-profile-pic-container">
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
                          </div>
                          
                          <div className="fb-friend-card-info">
                            <h3 className="fb-friend-card-name">{getFullName(suggestion)}</h3>
                            <p className="fb-friend-card-mutual">
                              {suggestion.mutual_friends > 0 
                                ? `${suggestion.mutual_friends} amis en commun`
                                : 'Suggestion pour vous'
                              }
                            </p>
                          </div>
                          
                          <div className="fb-friend-card-actions">
                            <button
                              onClick={() => handleAddFriend(suggestion.id)}
                              className="fb-friend-card-btn fb-friend-card-add"
                              disabled={isSending}
                            >
                              <UserPlus className="fb-friend-card-icon" />
                              {isSending ? 'Envoi...' : 'Ajouter'}
                            </button>
                            <button
                              onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                              className="fb-friend-card-btn fb-friend-card-remove"
                              disabled={isSending}
                            >
                              <X className="fb-friend-card-icon" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="fb-error-toast">
          <p>{error}</p>
          <button onClick={() => setError('')} className="fb-error-close">
            <X className="fb-error-close-icon" />
          </button>
        </div>
      )}
    </div>
  );
};
export default FriendsPage;