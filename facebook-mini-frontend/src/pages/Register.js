import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    if (!file.type.match('image.*')) {
      setError('Seules les images sont autorisées');
      return;
    }

    // Vérification de la taille
    if (file.size > 5 * 1024 * 1024) {
      setError('La taille maximale est de 5MB');
      return;
    }

    setProfilePicture(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      return 'Tous les champs obligatoires doivent être remplis';
    }

    if (username.length < 3) {
      return 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Email invalide';
    }

    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phone', formData.phone.trim());
      formDataToSend.append('bio', formData.bio.trim());
      
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      // Debug: Afficher le contenu de FormData
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value}`);
      }

      const result = await register(formDataToSend);
      
      if (result && result.success) {
        navigate('/', { state: { fromRegister: true } });
      } else {
        throw new Error(result?.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      console.error("Erreur d'inscription:", err);
      setError(err.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  };

  const formContainerStyle = {
    width: '100%',
    maxWidth: '500px',
    background: '#1a1a2e',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    marginBottom: '15px',
    background: '#0f0f23',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    transition: 'all 0.3s'
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px'
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h2 style={{ 
          color: '#fff', 
          textAlign: 'center', 
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Créer un compte
        </h2>

        {error && (
          <div style={{
            color: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Photo de profil */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Photo de profil (optionnel)
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handleImageChange}
              style={{ 
                ...inputStyle,
                padding: '10px',
                cursor: 'pointer'
              }}
            />
            {previewImage && (
              <div style={{ 
                marginTop: '10px', 
                textAlign: 'center',
                position: 'relative',
                display: 'inline-block'
              }}>
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '3px solid #667eea'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setProfilePicture(null);
                    document.getElementById('profilePicture').value = '';
                  }}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Champs du formulaire */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              style={inputStyle}
              placeholder="Votre nom d'utilisateur"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="votre@email.com"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={inputStyle}
              placeholder="+261 34 12 345 67"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Mot de passe *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={inputStyle}
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Retapez votre mot de passe"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#e0e0e0', 
              marginBottom: '8px' 
            }}>
              Bio (optionnel)
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              style={{ 
                ...inputStyle,
                minHeight: '100px',
                resize: 'vertical'
              }}
              placeholder="Parlez-nous un peu de vous..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
          >
            {loading ? (
              <>
                <span style={{
                  position: 'absolute',
                  left: '20px',
                  animation: 'spin 1s linear infinite'
                }}>⏳</span>
                Inscription en cours...
              </>
            ) : 'S\'inscrire'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#a0a0a0'
        }}>
          Déjà un compte ?{' '}
          <Link 
            to="/login" 
            style={{ 
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;