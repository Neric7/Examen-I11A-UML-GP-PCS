import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Petite pause pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));
      logout(navigate);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Retour à la page précédente
  };

  return (
    <div className="logout-page">
      <div className="logout-container">
        <div className="logout-card">
          <div className="logout-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          
          <h2 className="logout-title">Confirmation de déconnexion</h2>
          
          <div className="logout-message">
            <p>
              {user?.first_name ? (
                <>Bonjour <strong>{user.first_name}</strong>, </>
              ) : (
                'Bonjour, '
              )}
              voulez-vous vraiment vous déconnecter ?
            </p>
            <p className="logout-subtitle">
              Vous devrez vous reconnecter pour accéder à votre compte.
            </p>
          </div>

          <div className="logout-actions">
            <button
              onClick={handleCancel}
              className="btn btn-cancel"
              disabled={isLoggingOut}
            >
              Annuler
            </button>
            
            <button
              onClick={handleConfirmLogout}
              className="btn btn-logout"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span className="spinner"></span>
                  Déconnexion...
                </>
              ) : (
                'Oui, me déconnecter'
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .logout-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .logout-container {
          width: 100%;
          max-width: 400px;
        }

        .logout-card {
          background: white;
          border-radius: 12px;
          padding: 40px 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          text-align: center;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logout-icon {
          color: #f56565;
          margin-bottom: 20px;
        }

        .logout-icon svg {
          width: 64px;
          height: 64px;
        }

        .logout-title {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
          margin-top: 0;
        }

        .logout-message {
          margin-bottom: 30px;
        }

        .logout-message p {
          margin: 0 0 10px 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .logout-subtitle {
          font-size: 14px;
          color: #718096 !important;
        }

        .logout-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
          justify-content: center;
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-cancel {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .btn-logout {
          background: #f56565;
          color: white;
        }

        .btn-logout:hover:not(:disabled) {
          background: #e53e3e;
          transform: translateY(-1px);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .logout-card {
            padding: 30px 20px;
          }
          
          .logout-actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LogoutPage;