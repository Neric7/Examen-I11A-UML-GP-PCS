import React, { useState } from 'react';
import { Home, Users, Bell, Mail, User, Heart, MessageCircle, Share } from 'lucide-react';

const FacebookNavigation = () => {
  const [activePage, setActivePage] = useState('home');
  const [friendRequests] = useState([
    { id: 1, name: 'Alice Martin', avatar: '👩', mutualFriends: 5 },
    { id: 2, name: 'Bob Johnson', avatar: '👨', mutualFriends: 3 },
    { id: 3, name: 'Claire Davis', avatar: '👩‍🦰', mutualFriends: 7 }
  ]);

  const posts = [
    {
      id: 1,
      author: 'Marie Dubois',
      avatar: '👩‍💼',
      time: '2h',
      content: 'Magnifique coucher de soleil aujourd\'hui ! 🌅',
      likes: 24,
      comments: 8
    },
    {
      id: 2,
      author: 'Pierre Martin',
      avatar: '👨‍🔬',
      time: '4h',
      content: 'Fier d\'annoncer que notre équipe a terminé le projet ! Merci à tous 🎉',
      likes: 45,
      comments: 12
    }
  ];

  const messages = [
    { id: 1, sender: 'Sophie', avatar: '👩‍🎨', preview: 'Salut ! Comment ça va ?', time: '10:30', unread: true },
    { id: 2, sender: 'Thomas', avatar: '👨‍💻', preview: 'On se voit ce soir ?', time: '09:15', unread: true },
    { id: 3, sender: 'Emma', avatar: '👩‍🏫', preview: 'Merci pour ton aide !', time: 'Hier', unread: false },
    { id: 4, sender: 'Lucas', avatar: '👨‍🎯', preview: 'Super photo !', time: 'Hier', unread: true },
    { id: 5, sender: 'Camille', avatar: '👩‍🎭', preview: 'À bientôt !', time: 'Lundi', unread: true }
  ];

  const friends = [
    { id: 1, name: 'Sophie Leroy', avatar: '👩‍🎨', status: 'En ligne' },
    { id: 2, name: 'Thomas Bernard', avatar: '👨‍💻', status: 'Actif il y a 5 min' },
    { id: 3, name: 'Emma Moreau', avatar: '👩‍🏫', status: 'En ligne' },
    { id: 4, name: 'Lucas Petit', avatar: '👨‍🎯', status: 'Actif il y a 1h' }
  ];

  const renderHomePage = () => (
    <div className="fb-page">
      <div className="fb-page-header">
        <h2>Fil d'actualité</h2>
      </div>
      
      <div className="fb-create-post">
        <div className="fb-create-post-header">
          <div className="fb-avatar">👤</div>
          <input type="text" placeholder="Que voulez-vous dire ?" className="fb-post-input" />
        </div>
        <div className="fb-create-post-actions">
          <button className="fb-post-action">📷 Photo/Vidéo</button>
          <button className="fb-post-action">😊 Sentiment</button>
        </div>
      </div>

      <div className="fb-posts">
        {posts.map(post => (
          <div key={post.id} className="fb-post">
            <div className="fb-post-header">
              <div className="fb-avatar">{post.avatar}</div>
              <div className="fb-post-info">
                <h4>{post.author}</h4>
                <span className="fb-post-time">{post.time}</span>
              </div>
            </div>
            <div className="fb-post-content">
              <p>{post.content}</p>
            </div>
            <div className="fb-post-stats">
              <span>👍 {post.likes}</span>
              <span>{post.comments} commentaires</span>
            </div>
            <div className="fb-post-actions">
              <button className="fb-action-btn">
                <Heart className="fb-action-icon" /> J'aime
              </button>
              <button className="fb-action-btn">
                <MessageCircle className="fb-action-icon" /> Commenter
              </button>
              <button className="fb-action-btn">
                <Share className="fb-action-icon" /> Partager
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFriendsPage = () => (
    <div className="fb-page">
      <div className="fb-page-header">
        <h2>Amis</h2>
      </div>
      
      <div className="fb-friends-tabs">
        <button className="fb-tab-btn active">Tous les amis</button>
        <button className="fb-tab-btn">Récemment ajoutés</button>
        <button className="fb-tab-btn">Anniversaires</button>
      </div>

      <div className="fb-friends-list">
        {friends.map(friend => (
          <div key={friend.id} className="fb-friend-card">
            <div className="fb-avatar-large">{friend.avatar}</div>
            <div className="fb-friend-info">
              <h4>{friend.name}</h4>
              <span className="fb-friend-status">{friend.status}</span>
            </div>
            <div className="fb-friend-actions">
              <button className="fb-btn-primary">Message</button>
              <button className="fb-btn-secondary">Profil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsPage = () => (
    <div className="fb-page">
      <div className="fb-page-header">
        <h2>Notifications</h2>
      </div>
      
      {friendRequests.length > 0 && (
        <div className="fb-section">
          <h3>Demandes d'amis</h3>
          <div className="fb-friend-requests">
            {friendRequests.map(request => (
              <div key={request.id} className="fb-friend-request">
                <div className="fb-avatar-large">{request.avatar}</div>
                <div className="fb-request-info">
                  <h4>{request.name}</h4>
                  <span>{request.mutualFriends} amis en commun</span>
                </div>
                <div className="fb-request-actions">
                  <button className="fb-btn-primary">Confirmer</button>
                  <button className="fb-btn-secondary">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fb-section">
        <h3>Notifications récentes</h3>
        <div className="fb-notifications">
          <div className="fb-notification">
            <div className="fb-avatar">👩‍🎨</div>
            <div className="fb-notification-content">
              <p><strong>Sophie</strong> a aimé votre photo</p>
              <span className="fb-notification-time">Il y a 1h</span>
            </div>
          </div>
          <div className="fb-notification">
            <div className="fb-avatar">👨‍💻</div>
            <div className="fb-notification-content">
              <p><strong>Thomas</strong> a commenté votre publication</p>
              <span className="fb-notification-time">Il y a 3h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesPage = () => (
    <div className="fb-page">
      <div className="fb-page-header">
        <h2>Messages</h2>
        <button className="fb-btn-primary">Nouveau message</button>
      </div>
      
      <div className="fb-messages-list">
        {messages.map(message => (
          <div key={message.id} className={`fb-message-item ${message.unread ? 'unread' : ''}`}>
            <div className="fb-avatar">{message.avatar}</div>
            <div className="fb-message-content">
              <div className="fb-message-header">
                <h4>{message.sender}</h4>
                <span className="fb-message-time">{message.time}</span>
              </div>
              <p className="fb-message-preview">{message.preview}</p>
            </div>
            {message.unread && <div className="fb-unread-indicator"></div>}
          </div>
        ))}
      </div>
    </div>
  );

  const unreadMessagesCount = messages.filter(msg => msg.unread).length;

  return (
    <div className="fb-container">
      <header className="fb-header">
        <div className="fb-header-left">
          <h1 className="fb-logo">facebook</h1>
        </div>
        
        <nav className="fb-nav">
          <button 
            className={`fb-nav-button ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => setActivePage('home')}
          >
            <Home className="fb-nav-icon" />
          </button>
          <button 
            className={`fb-nav-button ${activePage === 'friends' ? 'active' : ''}`}
            onClick={() => setActivePage('friends')}
          >
            <Users className="fb-nav-icon" />
          </button>
          <button 
            className={`fb-nav-button fb-nav-button-notification ${activePage === 'notifications' ? 'active' : ''}`}
            onClick={() => setActivePage('notifications')}
          >
            <Bell className="fb-nav-icon" />
            {friendRequests.length > 0 && (
              <span className="fb-notification-badge">{friendRequests.length}</span>
            )}
          </button>
          <button 
            className={`fb-nav-button fb-nav-button-notification ${activePage === 'messages' ? 'active' : ''}`}
            onClick={() => setActivePage('messages')}
          >
            <Mail className="fb-nav-icon" />
            {unreadMessagesCount > 0 && (
              <span className="fb-notification-badge">{unreadMessagesCount}</span>
            )}
          </button>
        </nav>

        <div className="fb-header-right">
          <div className="fb-user-menu">
            <User className="fb-user-icon" />
            <span>Mon Profil</span>
          </div>
        </div>
      </header>

      <main className="fb-main">
        {activePage === 'home' && renderHomePage()}
        {activePage === 'friends' && renderFriendsPage()}
        {activePage === 'notifications' && renderNotificationsPage()}
        {activePage === 'messages' && renderMessagesPage()}
      </main>

      <style jsx>{`
        .fb-container {
          min-height: 100vh;
          background: #f0f2f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .fb-header {
          background: white;
          border-bottom: 1px solid #e4e6ea;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .fb-logo {
          color: #1877f2;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .fb-nav {
          display: flex;
          gap: 8px;
        }

        .fb-nav-button {
          background: none;
          border: none;
          padding: 12px 48px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fb-nav-button:hover {
          background: #f2f2f2;
        }

        .fb-nav-button.active {
          background: #e7f3ff;
          border-bottom: 3px solid #1877f2;
        }

        .fb-nav-icon {
          width: 24px;
          height: 24px;
          color: #65676b;
        }

        .fb-nav-button.active .fb-nav-icon {
          color: #1877f2;
        }

        .fb-notification-badge {
          position: absolute;
          top: 8px;
          right: 36px;
          background: #e41e3f;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .fb-user-menu {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .fb-user-menu:hover {
          background: #f2f2f2;
        }

        .fb-user-icon {
          width: 20px;
          height: 20px;
          color: #65676b;
        }

        .fb-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .fb-page {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .fb-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #e4e6ea;
          padding-bottom: 16px;
        }

        .fb-page-header h2 {
          margin: 0;
          color: #1c1e21;
          font-size: 24px;
          font-weight: bold;
        }

        .fb-create-post {
          background: white;
          border: 1px solid #e4e6ea;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .fb-create-post-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .fb-post-input {
          flex: 1;
          border: none;
          background: #f0f2f5;
          padding: 12px 16px;
          border-radius: 24px;
          font-size: 16px;
          outline: none;
        }

        .fb-create-post-actions {
          display: flex;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid #e4e6ea;
        }

        .fb-post-action {
          background: none;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          color: #65676b;
          font-weight: 600;
          transition: background 0.2s;
        }

        .fb-post-action:hover {
          background: #f2f2f2;
        }

        .fb-avatar, .fb-avatar-large {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e4e6ea;
          font-size: 20px;
        }

        .fb-avatar-large {
          width: 60px;
          height: 60px;
          font-size: 30px;
        }

        .fb-post {
          background: white;
          border: 1px solid #e4e6ea;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .fb-post-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .fb-post-info h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #1c1e21;
        }

        .fb-post-time {
          color: #65676b;
          font-size: 13px;
        }

        .fb-post-content {
          margin: 12px 0;
        }

        .fb-post-stats {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e4e6ea;
          color: #65676b;
          font-size: 14px;
        }

        .fb-post-actions {
          display: flex;
          justify-content: space-around;
          padding-top: 8px;
        }

        .fb-action-btn {
          background: none;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #65676b;
          font-weight: 600;
          transition: background 0.2s;
          flex: 1;
          justify-content: center;
        }

        .fb-action-btn:hover {
          background: #f2f2f2;
        }

        .fb-action-icon {
          width: 16px;
          height: 16px;
        }

        .fb-friends-tabs {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e4e6ea;
        }

        .fb-tab-btn {
          background: none;
          border: none;
          padding: 12px 0;
          cursor: pointer;
          color: #65676b;
          font-weight: 600;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .fb-tab-btn.active {
          color: #1877f2;
          border-bottom-color: #1877f2;
        }

        .fb-friends-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .fb-friend-card {
          border: 1px solid #e4e6ea;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fb-friend-info {
          flex: 1;
        }

        .fb-friend-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
        }

        .fb-friend-status {
          color: #65676b;
          font-size: 13px;
        }

        .fb-friend-actions {
          display: flex;
          gap: 8px;
        }

        .fb-btn-primary, .fb-btn-secondary {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .fb-btn-primary {
          background: #1877f2;
          color: white;
        }

        .fb-btn-primary:hover {
          background: #166fe5;
        }

        .fb-btn-secondary {
          background: #e4e6ea;
          color: #1c1e21;
        }

        .fb-btn-secondary:hover {
          background: #d8dadf;
        }

        .fb-section {
          margin-bottom: 24px;
        }

        .fb-section h3 {
          margin: 0 0 16px 0;
          color: #1c1e21;
          font-size: 18px;
          font-weight: bold;
        }

        .fb-friend-request {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e4e6ea;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .fb-request-info {
          flex: 1;
        }

        .fb-request-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
        }

        .fb-request-actions {
          display: flex;
          gap: 8px;
        }

        .fb-notification {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: background 0.2s;
          cursor: pointer;
        }

        .fb-notification:hover {
          background: #f2f2f2;
        }

        .fb-notification-content {
          flex: 1;
        }

        .fb-notification-content p {
          margin: 0 0 4px 0;
          color: #1c1e21;
        }

        .fb-notification-time {
          color: #65676b;
          font-size: 13px;
        }

        .fb-messages-list {
          display: flex;
          flex-direction: column;
        }

        .fb-message-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }

        .fb-message-item:hover {
          background: #f2f2f2;
        }

        .fb-message-item.unread {
          background: #e7f3ff;
        }

        .fb-message-content {
          flex: 1;
        }

        .fb-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .fb-message-header h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }

        .fb-message-time {
          color: #65676b;
          font-size: 13px;
        }

        .fb-message-preview {
          color: #65676b;
          margin: 0;
          font-size: 14px;
        }

        .fb-unread-indicator {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          background: #1877f2;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default FacebookNavigation;