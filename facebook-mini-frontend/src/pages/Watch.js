import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, 
  Share, Bookmark, ThumbsUp, Users, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Watch.css';

const WatchPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('for-you');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [savedVideos, setSavedVideos] = useState([]);
  const [error, setError] = useState('');
  const [likingVideo, setLikingVideo] = useState(null);
  const [savingVideo, setSavingVideo] = useState(null);
  const [followingCreator, setFollowingCreator] = useState(null);


  // Déplacer les données mock dans useMemo pour les mémoriser
  const { mockVideos, mockLiveVideos } = useMemo(() => {
    const mockVideosData = [
      {
        id: 1,
        title: 'Coucher de soleil spectaculaire à Andasibe',
        description: 'Découvrez la beauté naturelle de Madagascar lors de ce coucher de soleil magique dans la réserve d\'Andasibe-Mantadia.',
        creator: {
          name: 'Madagascar Nature',
          avatar: null,
          followers: 15000,
          isFollowing: false
        },
        thumbnail: null,
        videoUrl: null,
        duration: '2:34',
        views: 25600,
        likes: 892,
        comments: 45,
        shares: 123,
        timestamp: '2024-01-21T10:30:00Z',
        category: 'Nature',
        isLiked: false,
        isSaved: false
      },
      // ... autres vidéos mock
      {
      id: 2,
      title: 'Recette traditionnelle du Ravitoto',
      description: 'Apprenez à préparer le plat traditionnel malgache ravitoto avec ma grand-mère qui partage ses secrets de famille.',
      creator: {
        name: 'Cuisine Malagasy',
        avatar: null,
        followers: 8500,
        isFollowing: true
      },
      thumbnail: null,
      videoUrl: null,
      duration: '15:42',
      views: 12300,
      likes: 456,
      comments: 78,
      shares: 89,
      timestamp: '2024-01-20T16:15:00Z',
      category: 'Cuisine',
      isLiked: true,
      isSaved: false
    },
    {
      id: 3,
      title: 'Danse traditionnelle Hira Gasy',
      description: 'Performance authentique de Hira Gasy par un groupe traditionnel de la région d\'Antananarivo.',
      creator: {
        name: 'Culture Malagasy',
        avatar: null,
        followers: 22000,
        isFollowing: false
      },
      thumbnail: null,
      videoUrl: null,
      duration: '8:17',
      views: 45600,
      likes: 1234,
      comments: 156,
      shares: 234,
      timestamp: '2024-01-19T14:20:00Z',
      category: 'Culture',
      isLiked: false,
      isSaved: true
    },
    {
      id: 4,
      title: 'Baobabs de Morondava au lever du jour',
      description: 'L\'avenue des Baobabs comme vous ne l\'avez jamais vue, filmée en drone au lever du soleil.',
      creator: {
        name: 'Drone Madagascar',
        avatar: null,
        followers: 35000,
        isFollowing: true
      },
      thumbnail: null,
      videoUrl: null,
      duration: '4:56',
      views: 78900,
      likes: 2145,
      comments: 89,
      shares: 456,
      timestamp: '2024-01-18T07:45:00Z',
      category: 'Voyage',
      isLiked: true,
      isSaved: true
    }
    ];
 const mockLiveVideosData = [
      {
        id: 'live1',
        title: 'Festival Donia en direct',
        creator: {
          name: 'Radio Télévision Malagasy',
          avatar: null,
          followers: 125000
        },
        viewers: 2500,
        category: 'Musique',
        isLive: true
      },
      // ... autres lives mock
      {
      id: 'live2',
      title: 'Débat politique en direct',
      creator: {
        name: 'TV Plus Madagascar',
        avatar: null,
        followers: 89000
      },
      viewers: 1200,
      category: 'Actualités',
      isLive: true
    }
    ];
    return { mockVideos: mockVideosData, mockLiveVideos: mockLiveVideosData };
  }, []);

    useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVideos(mockVideos);
      setSavedVideos(mockVideos.filter(video => video.isSaved));
      setLoading(false);
    };

    if (user && token) {
      loadData();
    }
  }, [user, token, mockVideos]);

  // Gérer le like d'une vidéo
  const handleLikeVideo = async (videoId) => {
    try {
      setLikingVideo(videoId);
      
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video.id === videoId) {
            const newIsLiked = !video.isLiked;
            return {
              ...video,
              isLiked: newIsLiked,
              likes: newIsLiked ? video.likes + 1 : video.likes - 1
            };
          }
          return video;
        })
      );
      
    } catch (error) {
      console.error('Erreur like vidéo:', error);
      setError('Erreur lors du like');
    } finally {
      setLikingVideo(null);
    }
  };

  // Sauvegarder une vidéo
  const handleSaveVideo = async (videoId) => {
    try {
      setSavingVideo(videoId);
      
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video.id === videoId) {
            const newIsSaved = !video.isSaved;
            return { ...video, isSaved: newIsSaved };
          }
          return video;
        })
      );
      
      // Mettre à jour les vidéos sauvegardées
      const updatedVideo = videos.find(v => v.id === videoId);
      if (updatedVideo) {
        if (!updatedVideo.isSaved) {
          setSavedVideos(prev => [...prev, { ...updatedVideo, isSaved: true }]);
        } else {
          setSavedVideos(prev => prev.filter(v => v.id !== videoId));
        }
      }
      
    } catch (error) {
      console.error('Erreur sauvegarde vidéo:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSavingVideo(null);
    }
  };

  // Suivre un créateur
  const handleFollowCreator = async (videoId) => {
    try {
      setFollowingCreator(videoId);
      
      // Simuler l'API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video.id === videoId) {
            return {
              ...video,
              creator: {
                ...video.creator,
                isFollowing: !video.creator.isFollowing,
                followers: video.creator.isFollowing 
                  ? video.creator.followers - 1 
                  : video.creator.followers + 1
              }
            };
          }
          return video;
        })
      );
      
    } catch (error) {
      console.error('Erreur follow créateur:', error);
      setError('Erreur lors du suivi');
    } finally {
      setFollowingCreator(null);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";
    return date.toLocaleDateString('fr-FR');
  };

  const getFilteredVideos = () => {
    switch (activeTab) {
      case 'following':
        return videos.filter(video => video.creator.isFollowing);
      case 'saved':
        return savedVideos;
      case 'live':
        return mockLiveVideos; // Maintenant correctement défini
      default:
        return videos;
    }
  };

  const filteredVideos = getFilteredVideos().filter(video => {
    if (!searchTerm) return true;
    return video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           video.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!user) {
    return (
      <div className="fb-public-container">
        <div className="fb-public-content">
          <h2>Accès restreint</h2>
          <p>Connectez-vous pour regarder des vidéos.</p>
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

      <div className="fb-watch-container">
        <div className="fb-watch-header">
          <h1 className="fb-watch-title">Watch</h1>
          
          {/* Barre de recherche */}
          <div className="fb-watch-search">
            <Search className="fb-search-icon" />
            <input
              type="text"
              placeholder="Rechercher des vidéos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fb-search-input"
            />
            <button className="fb-watch-filter">
              <Filter className="fb-watch-filter-icon" />
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="fb-watch-tabs">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`fb-watch-tab ${activeTab === 'for-you' ? 'active' : ''}`}
          >
            Pour vous
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`fb-watch-tab ${activeTab === 'following' ? 'active' : ''}`}
          >
            Abonnements
          </button>
                    <button
            onClick={() => setActiveTab('saved')}
            className={`fb-watch-tab ${activeTab === 'saved' ? 'active' : ''}`}
          >
            Enregistrés
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`fb-watch-tab ${activeTab === 'live' ? 'active' : ''}`}
          >
            En direct
          </button>
        </div>

        {/* Contenu principal */}
        <div className="fb-watch-content">
          {loading ? (
            <div className="fb-watch-loading">
              <div className="fb-spinner"></div>
              <p>Chargement des vidéos...</p>
            </div>
          ) : error ? (
            <div className="fb-watch-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          ) : (
            <div className="fb-watch-videos">
              {activeTab === 'live' ? (
        <div className="fb-live-videos-grid">
          {mockLiveVideos.map(live => ( // Maintenant correctement défini
            <div key={live.id} className="fb-live-video-card">
                      <div className="fb-live-thumbnail">
                        <div className="fb-live-badge">EN DIRECT</div>
                        <div className="fb-live-viewers">
                          <span className="fb-live-dot"></span>
                          {formatNumber(live.viewers)} spectateurs
                        </div>
                      </div>
                      <div className="fb-live-info">
                        <h3>{live.title}</h3>
                        <p>{live.creator.name}</p>
                        <span className="fb-live-category">{live.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Affichage des vidéos normales
                <div className="fb-videos-grid">
                  {filteredVideos.map(video => (
                    <div key={video.id} className="fb-video-card">
                      <div 
                        className="fb-video-thumbnail"
                        onClick={() => setCurrentVideo(video)}
                      >
                        {currentVideo?.id === video.id && (
                          <div className="fb-video-player">
                            <video
                              src={video.videoUrl}
                              controls
                              autoPlay={isPlaying}
                              muted={isMuted}
                              className="fb-video-element"
                            />
                            <div className="fb-video-controls">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsPlaying(!isPlaying);
                                }}
                                className="fb-video-control-btn"
                              >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsMuted(!isMuted);
                                }}
                                className="fb-video-control-btn"
                              >
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                              </button>
                              <button className="fb-video-control-btn">
                                <Maximize size={20} />
                              </button>
                            </div>
                          </div>
                        )}
                        {currentVideo?.id !== video.id && (
                          <>
                            <div className="fb-video-duration">{video.duration}</div>
                            <button className="fb-video-play-btn">
                              <Play size={24} />
                            </button>
                          </>
                        )}
                      </div>
                      
                      <div className="fb-video-info">
                        <div className="fb-video-creator">
                          <div className="fb-video-avatar">
                            {video.creator.avatar ? (
                              <img 
                                src={video.creator.avatar} 
                                alt={video.creator.name}
                              />
                            ) : (
                              <div className="fb-video-avatar-initial">
                                {video.creator.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="fb-video-creator-details">
                            <h3>{video.creator.name}</h3>
                            <p>{formatNumber(video.creator.followers)} abonnés</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowCreator(video.id);
                            }}
                            className={`fb-video-follow-btn ${video.creator.isFollowing ? 'following' : ''}`}
                            disabled={followingCreator === video.id}
                          >
                            {followingCreator === video.id ? (
                              '...'
                            ) : video.creator.isFollowing ? (
                              'Abonné'
                            ) : (
                              'S\'abonner'
                            )}
                          </button>
                        </div>
                        
                        <h4 className="fb-video-title">{video.title}</h4>
                        <p className="fb-video-description">{video.description}</p>
                        
                        <div className="fb-video-stats">
                          <span>{formatNumber(video.views)} vues</span>
                          <span>•</span>
                          <span>{formatDate(video.timestamp)}</span>
                          <span>•</span>
                          <span>{video.category}</span>
                        </div>
                        
                        <div className="fb-video-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeVideo(video.id);
                            }}
                            className={`fb-video-action-btn ${video.isLiked ? 'liked' : ''}`}
                            disabled={likingVideo === video.id}
                          >
                            <ThumbsUp size={18} />
                            <span>{formatNumber(video.likes)}</span>
                          </button>
                          
                          <button className="fb-video-action-btn">
                            <MessageCircle size={18} />
                            <span>{formatNumber(video.comments)}</span>
                          </button>
                          
                          <button className="fb-video-action-btn">
                            <Share size={18} />
                            <span>{formatNumber(video.shares)}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveVideo(video.id);
                            }}
                            className={`fb-video-action-btn ${video.isSaved ? 'saved' : ''}`}
                            disabled={savingVideo === video.id}
                          >
                            <Bookmark size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {filteredVideos.length === 0 && (
                <div className="fb-watch-empty">
                  <p>Aucune vidéo trouvée</p>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}>Effacer la recherche</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;