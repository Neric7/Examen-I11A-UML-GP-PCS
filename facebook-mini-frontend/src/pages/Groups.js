import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Users, Plus, Settings, Bell, Lock, Globe, X, Star, MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles.css';

// Déplacer les données mock à l'extérieur du composant pour éviter les warnings ESLint
const mockGroups = [
  {
    id: 1,
    name: 'Développeurs React Madagascar',
    description: 'Communauté des développeurs React à Madagascar',
    memberCount: 1247,
    privacy: 'public',
    category: 'Technologie',
    coverImage: null,
    isJoined: false,
    lastActivity: '2024-01-20T10:30:00Z'
  },
  {
    id: 2,
    name: 'Photographes Antananarivo',
    description: 'Partagez vos plus belles photos de la capitale',
    memberCount: 892,
    privacy: 'public',
    category: 'Art & Photographie',
    coverImage: null,
    isJoined: true,
    lastActivity: '2024-01-19T15:45:00Z'
  },
  {
    id: 3,
    name: 'Entrepreneurs Madagascar',
    description: 'Réseau d\'entraide pour entrepreneurs malgaches',
    memberCount: 543,
    privacy: 'private',
    category: 'Business',
    coverImage: null,
    isJoined: false,
    lastActivity: '2024-01-18T09:15:00Z'
  },
  {
    id: 4,
    name: 'Cuisine Malgache Traditionnelle',
    description: 'Recettes et astuces de cuisine traditionnelle',
    memberCount: 2156,
    privacy: 'public',
    category: 'Cuisine',
    coverImage: null,
    isJoined: true,
    lastActivity: '2024-01-21T12:00:00Z'
  }
];

// Données fictives pour le feed des groupes
const mockGroupFeed = [
  {
    id: 1,
    groupId: 2,
    groupName: 'Photographes Antananarivo',
    author: 'Marie Rakoto',
    content: 'Coucher de soleil magnifique depuis Ambohimanga !',
    image: null,
    timestamp: '2024-01-21T16:30:00Z',
    likes: 24,
    comments: 5
  },
  {
    id: 2,
    groupId: 4,
    groupName: 'Cuisine Malgache Traditionnelle',
    author: 'Jean Ratsimba',
    content: 'Ma grand-mère nous a transmis cette recette de romazava authentique. Qui veut la recette complète ?',
    image: null,
    timestamp: '2024-01-21T14:15:00Z',
    likes: 18,
    comments: 12
  }
];

const GroupsPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'discover', 'your-groups', 'create'
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [groupFeed, setGroupFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(null);
  const [leavingGroup, setLeavingGroup] = useState(null);
  const [error, setError] = useState('');

  // États pour créer un groupe
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    privacy: 'public', // public, private
    category: 'general'
  });
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGroups(mockGroups);
      setUserGroups(mockGroups.filter(group => group.isJoined));
      setGroupFeed(mockGroupFeed);
      setLoading(false);
    };

    if (user && token) {
      loadData();
    }
  }, [user, token]); // Maintenant les données mock sont externes, pas besoin de les inclure

  // Rejoindre un groupe
  const handleJoinGroup = async (groupId) => {
    try {
      setJoiningGroup(groupId);
      
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'état local
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
            : group
        )
      );
      
      // Ajouter aux groupes de l'utilisateur
      const joinedGroup = groups.find(g => g.id === groupId);
      if (joinedGroup) {
        setUserGroups(prev => [...prev, { ...joinedGroup, isJoined: true }]);
      }
      
    } catch (error) {
      console.error('Erreur rejoindre groupe:', error);
      setError('Erreur lors de l\'adhésion au groupe');
    } finally {
      setJoiningGroup(null);
    }
  };

  // Quitter un groupe
  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
      return;
    }

    try {
      setLeavingGroup(groupId);
      
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'état local
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, isJoined: false, memberCount: Math.max(0, group.memberCount - 1) }
            : group
        )
      );
      
      // Supprimer des groupes de l'utilisateur
      setUserGroups(prev => prev.filter(group => group.id !== groupId));
      
    } catch (error) {
      console.error('Erreur quitter groupe:', error);
      setError('Erreur lors de la sortie du groupe');
    } finally {
      setLeavingGroup(null);
    }
  };

  // Créer un nouveau groupe
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroup.name.trim()) {
      setError('Le nom du groupe est requis');
      return;
    }

    try {
      setCreatingGroup(true);
      
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const createdGroup = {
        id: Date.now(),
        name: newGroup.name,
        description: newGroup.description,
        privacy: newGroup.privacy,
        category: newGroup.category,
        memberCount: 1,
        isJoined: true,
        lastActivity: new Date().toISOString(),
        coverImage: null
      };
      
      // Ajouter le nouveau groupe
      setGroups(prev => [createdGroup, ...prev]);
      setUserGroups(prev => [createdGroup, ...prev]);
      
      // Réinitialiser le formulaire
      setNewGroup({
        name: '',
        description: '',
        privacy: 'public',
        category: 'general'
      });
      setShowCreateForm(false);
      setActiveTab('your-groups');
      
    } catch (error) {
      console.error('Erreur création groupe:', error);
      setError('Erreur lors de la création du groupe');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Filtrer les groupes selon le terme de recherche
  const filteredGroups = groups.filter(group => {
    return group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           group.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";
    return date.toLocaleDateString('fr-FR');
  };

  if (!user) {
    return (
      <div className="fb-public-container">
        <div className="fb-public-content">
          <h2>Accès restreint</h2>
          <p>Connectez-vous pour voir les groupes.</p>
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

      <div className="fb-groups-container">
        <div className="fb-groups-header">
          <h1 className="fb-groups-title">Groupes</h1>
          
          {/* Barre de recherche */}
          <div className="fb-groups-search">
            <Search className="fb-search-icon" />
            <input
              type="text"
              placeholder="Rechercher des groupes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fb-search-input"
            />
          </div>
        </div>

        {/* Onglets */}
        <div className="fb-groups-tabs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`fb-groups-tab ${activeTab === 'feed' ? 'active' : ''}`}
          >
            Fil d'actualité
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`fb-groups-tab ${activeTab === 'discover' ? 'active' : ''}`}
          >
            Découvrir ({filteredGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('your-groups')}
            className={`fb-groups-tab ${activeTab === 'your-groups' ? 'active' : ''}`}
          >
            Vos groupes ({userGroups.length})
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="fb-groups-tab fb-groups-create-btn"
          >
            <Plus className="fb-groups-tab-icon" />
            Créer
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        <div className="fb-groups-content">
          {loading ? (
            <div className="fb-loading-container">
              <p>Chargement...</p>
            </div>
          ) : (
            <>
              {/* Fil d'actualité des groupes */}
              {activeTab === 'feed' && (
                <div className="fb-groups-feed">
                  {groupFeed.length === 0 ? (
                    <div className="fb-empty-state">
                      <MessageCircle className="fb-empty-icon" />
                      <h3>Aucune activité récente</h3>
                      <p>Rejoignez des groupes pour voir leurs publications ici.</p>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="fb-primary-btn"
                      >
                        Découvrir des groupes
                      </button>
                    </div>
                  ) : (
                    groupFeed.map(post => (
                      <div key={post.id} className="fb-group-post">
                        <div className="fb-group-post-header">
                          <div className="fb-group-post-info">
                            <h4 className="fb-group-post-group">{post.groupName}</h4>
                            <div className="fb-group-post-meta">
                              <span className="fb-group-post-author">{post.author}</span>
                              <span className="fb-group-post-time">{formatDate(post.timestamp)}</span>
                            </div>
                          </div>
                          <button className="fb-group-post-more">
                            <Settings className="fb-group-post-more-icon" />
                          </button>
                        </div>
                        
                        <div className="fb-group-post-content">
                          <p>{post.content}</p>
                          {post.image && (
                            <img 
                              src={post.image} 
                              alt="Publication" 
                              className="fb-group-post-image"
                            />
                          )}
                        </div>
                        
                        <div className="fb-group-post-actions">
                          <button className="fb-group-post-action">
                            <span>{post.likes} J'aime</span>
                          </button>
                          <button className="fb-group-post-action">
                            <span>{post.comments} Commentaires</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Découvrir des groupes */}
              {activeTab === 'discover' && (
                <div className="fb-groups-grid">
                  {filteredGroups.length === 0 ? (
                    <div className="fb-empty-state">
                      <Search className="fb-empty-icon" />
                      <h3>Aucun groupe trouvé</h3>
                      <p>
                        {searchTerm 
                          ? 'Aucun groupe ne correspond à votre recherche.'
                          : 'Créez le premier groupe de votre communauté!'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredGroups.map(group => {
                      const isJoining = joiningGroup === group.id;
                      const isLeaving = leavingGroup === group.id;
                      
                      return (
                        <div key={group.id} className="fb-group-card">
                          <div className="fb-group-card-header">
                            <div className="fb-group-card-cover">
                              {group.coverImage ? (
                                <img 
                                  src={group.coverImage}
                                  alt={group.name}
                                  className="fb-group-cover-image"
                                />
                              ) : (
                                <div className="fb-group-cover-placeholder">
                                  <Users className="fb-group-cover-icon" />
                                </div>
                              )}
                            </div>
                            <div className="fb-group-privacy-badge">
                              {group.privacy === 'public' ? (
                                <Globe className="fb-group-privacy-icon" />
                              ) : (
                                <Lock className="fb-group-privacy-icon" />
                              )}
                              <span>{group.privacy === 'public' ? 'Public' : 'Privé'}</span>
                            </div>
                          </div>
                          
                          <div className="fb-group-card-info">
                            <h3 className="fb-group-card-name">{group.name}</h3>
                            <p className="fb-group-card-description">{group.description}</p>
                            <div className="fb-group-card-stats">
                              <span className="fb-group-card-members">
                                {group.memberCount.toLocaleString()} membres
                              </span>
                              <span className="fb-group-card-category">{group.category}</span>
                            </div>
                            <p className="fb-group-card-activity">
                              Dernière activité: {formatDate(group.lastActivity)}
                            </p>
                          </div>
                          
                          <div className="fb-group-card-actions">
                            {group.isJoined ? (
                              <button
                                onClick={() => handleLeaveGroup(group.id)}
                                className="fb-group-card-btn fb-group-card-leave"
                                disabled={isLeaving}
                              >
                                {isLeaving ? 'Départ...' : 'Quitter'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinGroup(group.id)}
                                className="fb-group-card-btn fb-group-card-join"
                                disabled={isJoining}
                              >
                                <Plus className="fb-group-card-icon" />
                                {isJoining ? 'Adhésion...' : 'Rejoindre'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Vos groupes */}
              {activeTab === 'your-groups' && (
                <div className="fb-groups-grid">
                  {userGroups.length === 0 ? (
                    <div className="fb-empty-state">
                      <Users className="fb-empty-icon" />
                      <h3>Vous n'avez rejoint aucun groupe</h3>
                      <p>Découvrez des groupes qui correspondent à vos intérêts.</p>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="fb-primary-btn"
                      >
                        Découvrir des groupes
                      </button>
                    </div>
                  ) : (
                    userGroups.map(group => {
                      const isLeaving = leavingGroup === group.id;
                      
                      return (
                        <div key={group.id} className="fb-group-card fb-user-group-card">
                          <div className="fb-group-card-header">
                            <div className="fb-group-card-cover">
                              {group.coverImage ? (
                                <img 
                                  src={group.coverImage}
                                  alt={group.name}
                                  className="fb-group-cover-image"
                                />
                              ) : (
                                <div className="fb-group-cover-placeholder">
                                  <Users className="fb-group-cover-icon" />
                                </div>
                              )}
                            </div>
                            <div className="fb-group-member-badge">
                              <Star className="fb-group-member-icon" />
                              <span>Membre</span>
                            </div>
                          </div>
                          
                          <div className="fb-group-card-info">
                            <h3 className="fb-group-card-name">{group.name}</h3>
                            <p className="fb-group-card-description">{group.description}</p>
                            <div className="fb-group-card-stats">
                              <span className="fb-group-card-members">
                                {group.memberCount.toLocaleString()} membres
                              </span>
                              <span className="fb-group-card-category">{group.category}</span>
                            </div>
                          </div>
                          
                          <div className="fb-group-card-actions">
                            <button className="fb-group-card-btn fb-group-card-view">
                              Voir le groupe
                            </button>
                            <div className="fb-group-card-dropdown">
                              <button className="fb-group-card-btn fb-group-card-more">
                                <Settings className="fb-group-card-icon" />
                              </button>
                              <div className="fb-group-card-dropdown-menu">
                                <button className="fb-group-card-dropdown-item">
                                  <Bell className="fb-group-card-dropdown-icon" />
                                  Notifications activées
                                </button>
                                <button
                                  onClick={() => handleLeaveGroup(group.id)}
                                  className="fb-group-card-dropdown-item fb-danger"
                                  disabled={isLeaving}
                                >
                                  <X className="fb-group-card-dropdown-icon" />
                                  {isLeaving ? 'Départ...' : 'Quitter le groupe'}
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
            </>
          )}
        </div>
      </div>

      {/* Modal de création de groupe */}
      {showCreateForm && (
        <div className="fb-modal-overlay">
          <div className="fb-modal">
            <div className="fb-modal-header">
              <h2>Créer un nouveau groupe</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="fb-modal-close"
                disabled={creatingGroup}
              >
                <X className="fb-modal-close-icon" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="fb-create-group-form">
              <div className="fb-form-group">
                <label htmlFor="groupName" className="fb-form-label">
                  Nom du groupe *
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="fb-form-input"
                  placeholder="Entrez le nom du groupe"
                  disabled={creatingGroup}
                  required
                />
              </div>
              
              <div className="fb-form-group">
                <label htmlFor="groupDescription" className="fb-form-label">
                  Description
                </label>
                <textarea
                  id="groupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  className="fb-form-textarea"
                  placeholder="Décrivez votre groupe..."
                  rows="3"
                  disabled={creatingGroup}
                />
              </div>
              
              <div className="fb-form-group">
                <label htmlFor="groupPrivacy" className="fb-form-label">
                  Confidentialité
                </label>
                <select
                  id="groupPrivacy"
                  value={newGroup.privacy}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, privacy: e.target.value }))}
                  className="fb-form-select"
                  disabled={creatingGroup}
                >
                  <option value="public">Public - Tout le monde peut voir le groupe</option>
                  <option value="private">Privé - Seuls les membres peuvent voir le contenu</option>
                </select>
              </div>
              
              <div className="fb-form-group">
                <label htmlFor="groupCategory" className="fb-form-label">
                  Catégorie
                </label>
                <select
                  id="groupCategory" 
                  value={newGroup.category}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                  className="fb-form-select"
                  disabled={creatingGroup}
                >
                  <option value="general">Général</option>
                  <option value="technology">Technologie</option>
                  <option value="art">Art & Photographie</option>
                  <option value="business">Business</option>
                  <option value="cuisine">Cuisine</option>
                  <option value="sports">Sports</option>
                  <option value="education">Éducation</option>
                  <option value="music">Musique</option>
                </select>
              </div>
              
              <div className="fb-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="fb-secondary-btn"
                  disabled={creatingGroup}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="fb-primary-btn"
                  disabled={creatingGroup || !newGroup.name.trim()}
                >
                  {creatingGroup ? 'Création...' : 'Créer le groupe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default GroupsPage;