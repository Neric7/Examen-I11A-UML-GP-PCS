import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, loading, api, refreshUserData } = useAuth();

    // États locaux pour le mode édition et les données du formulaire
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        city: '',
        country: '',
        website: '',
        occupation: '',
        relationship: '',
        interests: '',
        profilePicture: null // Fichier au lieu d'URL
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Fonction helper pour obtenir la valeur d'un champ (gère les deux formats)
    const getFieldValue = (user, camelCase, snakeCase) => {
        return user[camelCase] || user[snakeCase] || '';
    };

    // Remplir le formulaire quand l'utilisateur est chargé
    useEffect(() => {
        if (user) {
            console.log('User data received:', user); // Debug
            setFormData({
                username: getFieldValue(user, 'username', 'username'),
                email: getFieldValue(user, 'email', 'email'),
                bio: getFieldValue(user, 'bio', 'bio'),
                firstName: getFieldValue(user, 'firstName', 'first_name'),
                lastName: getFieldValue(user, 'lastName', 'last_name'),
                phone: getFieldValue(user, 'phone', 'phone'),
                dateOfBirth: (() => {
                    const date = getFieldValue(user, 'dateOfBirth', 'date_of_birth');
                    return date ? date.split('T')[0] : '';
                })(),
                city: getFieldValue(user, 'city', 'city'),
                country: getFieldValue(user, 'country', 'country'),
                website: getFieldValue(user, 'website', 'website'),
                occupation: getFieldValue(user, 'occupation', 'occupation'),
                relationship: getFieldValue(user, 'relationship', 'relationship'),
                interests: getFieldValue(user, 'interests', 'interests'),
                profilePicture: null
            });
            
            // Définir l'aperçu de l'image actuelle
            const pictureName = getFieldValue(user, 'profilePicture', 'profile_picture');
            if (pictureName) {
                setImagePreview(`http://localhost:3001/uploads/profile-pictures/${pictureName}`);
            }
        }
    }, [user]);

    const handleEditClick = () => {
        setIsEditing(true);
        setError('');
        setSuccessMessage('');
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        // Réinitialiser le formulaire
        if (user) {
            setFormData({
                username: getFieldValue(user, 'username', 'username'),
                email: getFieldValue(user, 'email', 'email'),
                bio: getFieldValue(user, 'bio', 'bio'),
                firstName: getFieldValue(user, 'firstName', 'first_name'),
                lastName: getFieldValue(user, 'lastName', 'last_name'),
                phone: getFieldValue(user, 'phone', 'phone'),
                dateOfBirth: (() => {
                    const date = getFieldValue(user, 'dateOfBirth', 'date_of_birth');
                    return date ? date.split('T')[0] : '';
                })(),
                city: getFieldValue(user, 'city', 'city'),
                country: getFieldValue(user, 'country', 'country'),
                website: getFieldValue(user, 'website', 'website'),
                occupation: getFieldValue(user, 'occupation', 'occupation'),
                relationship: getFieldValue(user, 'relationship', 'relationship'),
                interests: getFieldValue(user, 'interests', 'interests'),
                profilePicture: null
            });
            
            // Réinitialiser l'aperçu de l'image
            const pictureName = getFieldValue(user, 'profilePicture', 'profile_picture');
            if (pictureName) {
                setImagePreview(`http://localhost:3001/uploads/profile-pictures/${pictureName}`);
            } else {
                setImagePreview(null);
            }
        }
        setError('');
        setSuccessMessage('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            if (!file.type.startsWith('image/')) {
                setError('Veuillez sélectionner un fichier image valide.');
                return;
            }
            
            // Vérifier la taille du fichier (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Le fichier doit faire moins de 5MB.');
                return;
            }

            setFormData({
                ...formData,
                profilePicture: file
            });

            // Créer un aperçu de l'image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveClick = async () => {
        setSaving(true);
        setError('');
        setSuccessMessage('');

        if (!user || !user.id) {
            setError("Impossible de mettre à jour le profil: utilisateur non identifié.");
            setSaving(false);
            return;
        }

        try {
            // Créer FormData pour l'upload de fichier
            const formDataToSend = new FormData();
            
            // Ajouter tous les champs texte
            formDataToSend.append('username', formData.username);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('bio', formData.bio);
            formDataToSend.append('firstName', formData.firstName);
            formDataToSend.append('lastName', formData.lastName);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('dateOfBirth', formData.dateOfBirth);
            formDataToSend.append('city', formData.city);
            formDataToSend.append('country', formData.country);
            formDataToSend.append('website', formData.website);
            formDataToSend.append('occupation', formData.occupation);
            formDataToSend.append('relationship', formData.relationship);
            formDataToSend.append('interests', formData.interests);

            // Ajouter le fichier image si présent
            if (formData.profilePicture) {
                formDataToSend.append('profilePicture', formData.profilePicture);
            }

            console.log('Sending data to:', `/users/${user.id}`); // Debug

            const response = await api.put(`/users/${user.id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Update response:', response.data); // Debug

            setSuccessMessage("Profil mis à jour avec succès !");
            setIsEditing(false);
            
            // Réinitialiser le fichier sélectionné
            setFormData(prev => ({ ...prev, profilePicture: null }));

            // Actualiser les données utilisateur dans le contexte
            if (refreshUserData) {
                await refreshUserData();
                console.log('User data refreshed'); // Debug
            }

        } catch (err) {
            console.error("Erreur lors de la mise à jour du profil:", err);
            setError(err.response?.data?.message || err.message || "Échec de la mise à jour du profil.");
        } finally {
            setSaving(false);
        }
    };

    // Styles JavaScript corrigés pour le mode sombre
const styles = {
    container: {
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        paddingTop: '20px',
        color: '#ffffff'
    },
    profileHeader: {
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
        marginBottom: '16px',
        overflow: 'hidden',
        border: '1px solid #333333'
    },
    coverPhoto: {
        height: '348px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)',
        position: 'relative'
    },
    profileSection: {
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'flex-end',
        position: 'relative',
        minHeight: '100px'
    },
    profilePicture: {
        width: '168px',
        height: '168px',
        borderRadius: '50%',
        border: '4px solid #1a1a1a',
        objectFit: 'cover',
        position: 'absolute',
        top: '-84px',
        left: '24px',
        backgroundColor: '#1a1a1a'
    },
    profilePictureDefault: {
        width: '168px',
        height: '168px',
        borderRadius: '50%',
        border: '4px solid #1a1a1a',
        backgroundColor: '#667eea',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '4rem',
        fontWeight: 'bold',
        position: 'absolute',
        top: '-84px',
        left: '24px'
    },
    profileInfo: {
        marginLeft: '192px',
        flex: 1
    },
    profileName: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '4px'
    },
    profileBio: {
        fontSize: '15px',
        color: '#b0b3b8',
        marginBottom: '8px'
    },
    profileStats: {
        fontSize: '15px',
        color: '#8a8d91'
    },
    editButton: {
        backgroundColor: '#3a3b3c',
        color: '#ffffff',
        border: '1px solid #555555',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginLeft: 'auto'
    },
    contentArea: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '16px',
        padding: '0 16px'
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        padding: '20px',
        border: '1px solid #333333'
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '16px'
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '14px',
        fontSize: '15px'
    },
    infoIcon: {
        width: '20px',
        height: '20px',
        marginRight: '12px',
        color: '#b0b3b8'
    },
    infoText: {
        color: '#e4e6ea'
    },
    infoLabel: {
        color: '#b0b3b8',
        marginRight: '8px'
    },
    form: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        padding: '28px',
        border: '1px solid #333333'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#e4e6ea',
        marginBottom: '8px'
    },
    input: {
        padding: '12px 16px',
        border: '1px solid #3a3b3c',
        borderRadius: '8px',
        fontSize: '15px',
        backgroundColor: '#242526',
        color: '#e4e6ea',
        transition: 'border-color 0.2s, background-color 0.2s'
    },
    textarea: {
        padding: '12px 16px',
        border: '1px solid #3a3b3c',
        borderRadius: '8px',
        fontSize: '15px',
        backgroundColor: '#242526',
        color: '#e4e6ea',
        resize: 'vertical',
        minHeight: '120px',
        transition: 'border-color 0.2s, background-color 0.2s',
        fontFamily: 'inherit'
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '28px'
    },
    saveButton: {
        backgroundColor: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    cancelButton: {
        backgroundColor: '#3a3b3c',
        color: '#e4e6ea',
        border: '1px solid #555555',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    alert: {
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '15px'
    },
    alertSuccess: {
        backgroundColor: '#1f4a2c',
        color: '#4ade80',
        border: '1px solid #22c55e'
    },
    alertError: {
        backgroundColor: '#4a1f1f',
        color: '#f87171',
        border: '1px solid #ef4444'
    },
    fileInput: {
        display: 'none'
    },
    fileInputLabel: {
        display: 'inline-block',
        padding: '12px 20px',
        backgroundColor: '#3a3b3c',
        color: '#e4e6ea',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        transition: 'all 0.2s',
        border: '1px solid #555555'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontSize: '18px',
        color: '#b0b3b8'
    },
    profilePicturePreview: {
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '4px solid #667eea',
        marginBottom: '12px'
    },
    fileHelpText: {
        fontSize: '13px',
        color: '#8a8d91',
        marginTop: '8px'
    },
    aboutContent: {
        color: '#e4e6ea',
        fontSize: '15px',
        lineHeight: '1.4'
    },
    interestsContent: {
        color: '#e4e6ea',
        fontSize: '15px',
        lineHeight: '1.4'
    },
    aboutText: {
        color: '#e4e6ea',
        fontSize: '15px',
        lineHeight: '1.4'
    },
    interestsText: {
        color: '#e4e6ea',
        fontSize: '15px',
        lineHeight: '1.4'
    }
};

    // --- Rendu ---
    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <p>Vous devez être connecté pour voir cette page.</p>
                </div>
            </div>
        );
    }

    // Utiliser la fonction helper pour obtenir les valeurs
    const profilePicture = getFieldValue(user, 'profilePicture', 'profile_picture');
    const firstName = getFieldValue(user, 'firstName', 'first_name');
    const lastName = getFieldValue(user, 'lastName', 'last_name');
    const dateOfBirth = getFieldValue(user, 'dateOfBirth', 'date_of_birth');
    const registrationDate = getFieldValue(user, 'registration_date', 'registrationDate') || getFieldValue(user, 'createdAt', 'created_at');

    return (
        <div style={styles.container}>
            {/* Alerts */}
            {successMessage && (
                <div style={{...styles.alert, ...styles.alertSuccess, maxWidth: '1200px', margin: '0 auto 16px'}}>
                    {successMessage}
                </div>
            )}
            {error && (
                <div style={{...styles.alert, ...styles.alertError, maxWidth: '1200px', margin: '0 auto 16px'}}>
                    {error}
                </div>
            )}

            {/* Profile Header */}
            <div style={styles.profileHeader}>
                <div style={styles.coverPhoto}></div>
                <div style={styles.profileSection}>
                    {profilePicture ? (
                        <img 
                            src={`http://localhost:3001/uploads/profile-pictures/${profilePicture}`} 
                            alt="Profil" 
                            style={styles.profilePicture}
                            onError={(e) => {
                                console.error('Erreur chargement image profil:', e.target.src);
                                e.target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div style={styles.profilePictureDefault}>
                            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    
                    <div style={styles.profileInfo}>
                        <h1 style={styles.profileName}>
                            {firstName && lastName 
                                ? `${firstName} ${lastName}` 
                                : user.username || 'Utilisateur'}
                        </h1>
                        {user.bio && (
                            <p style={styles.profileBio}>{user.bio}</p>
                        )}
                        <div style={styles.profileStats}>
                            Membre depuis {registrationDate ? new Date(registrationDate).toLocaleDateString() : 'Date inconnue'}
                        </div>
                    </div>
                    
                    {!isEditing && (
                        <button 
                            onClick={handleEditClick}
                            style={styles.editButton}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#d8dadf'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#e4e6ea'}
                        >
                            ✏️ Modifier le profil
                        </button>
                    )}
                </div>
            </div>

            {!isEditing ? (
                // Mode Affichage
                <div style={styles.contentArea}>
                    <div style={styles.sidebar}>
                        {/* Informations personnelles */}
                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>Informations</h2>
                            
                            {user.email && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>📧</span>
                                    <span style={styles.infoText}>{user.email}</span>
                                </div>
                            )}
                            
                            {getFieldValue(user, 'phone', 'phone') && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>📱</span>
                                    <span style={styles.infoText}>{getFieldValue(user, 'phone', 'phone')}</span>
                                </div>
                            )}
                            
                            {getFieldValue(user, 'city', 'city') && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>📍</span>
                                    <span style={styles.infoText}>
                                        {getFieldValue(user, 'city', 'city')}{getFieldValue(user, 'country', 'country') ? `, ${getFieldValue(user, 'country', 'country')}` : ''}
                                    </span>
                                </div>
                            )}
                            
                            {getFieldValue(user, 'occupation', 'occupation') && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>💼</span>
                                    <span style={styles.infoText}>{getFieldValue(user, 'occupation', 'occupation')}</span>
                                </div>
                            )}
                            
                            {getFieldValue(user, 'relationship', 'relationship') && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>❤️</span>
                                    <span style={styles.infoText}>{getFieldValue(user, 'relationship', 'relationship')}</span>
                                </div>
                            )}
                            
                            {dateOfBirth && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>🎂</span>
                                    <span style={styles.infoText}>
                                        {new Date(dateOfBirth).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            
                            {getFieldValue(user, 'website', 'website') && (
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>🌐</span>
                                    <a href={getFieldValue(user, 'website', 'website')} target="_blank" rel="noopener noreferrer" style={{color: '#1877f2', textDecoration: 'none'}}>
                                        {getFieldValue(user, 'website', 'website')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Centres d'intérêt */}
                        {getFieldValue(user, 'interests', 'interests') && (
                            <div style={styles.card}>
                                <h2 style={styles.cardTitle}>Centres d'intérêt</h2>
                                <p style={{color: '#e4e6ea', fontSize: '15px', lineHeight: '1.4'}}>
                                    {getFieldValue(user, 'interests', 'interests')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Zone principale */}
                    <div>
                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>À propos</h2>
                            <p style={{color: '#e4e6ea', fontSize: '15px', lineHeight: '1.4'}}>
                                {user.bio || 'Aucune bio disponible'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // Mode Édition - reste identique
                <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 16px'}}>
                    <div style={styles.form}>
                        <h2 style={styles.cardTitle}>Modifier le profil</h2>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }}>
                            {/* Photo de profil */}
                            <div style={{textAlign: 'center', marginBottom: '24px'}}>
                                {imagePreview && (
                                    <img 
                                        src={imagePreview} 
                                        alt="Aperçu" 
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '4px solid #1877f2',
                                            marginBottom: '12px'
                                        }}
                                    />
                                )}
                                <div>
                                    <label htmlFor="profilePicture" style={styles.fileInputLabel}>
                                        📷 Choisir une photo
                                    </label>
                                    <input
                                        type="file"
                                        id="profilePicture"
                                        name="profilePicture"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={styles.fileInput}
                                    />
                                    <div style={{fontSize: '13px', color: '#65676b', marginTop: '8px'}}>
                                        Formats acceptés: JPG, PNG, GIF (max 5MB)
                                    </div>
                                </div>
                            </div>

                            {/* Informations de base */}
                            <div style={styles.formGrid}>
                                <div style={styles.inputGroup}>
                                    <label htmlFor="username" style={styles.label}>Nom d'utilisateur *</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="email" style={styles.label}>Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="firstName" style={styles.label}>Prénom</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="lastName" style={styles.label}>Nom</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="phone" style={styles.label}>Téléphone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="dateOfBirth" style={styles.label}>Date de naissance</label>
                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="city" style={styles.label}>Ville</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="country" style={styles.label}>Pays</label>
                                    <input
                                        type="text"
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="website" style={styles.label}>Site web</label>
                                    <input
                                        type="url"
                                        id="website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://exemple.com"
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="occupation" style={styles.label}>Profession</label>
                                    <input
                                        type="text"
                                        id="occupation"
                                        name="occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={styles.inputGroup}>
                                    <label htmlFor="relationship" style={styles.label}>Statut relationnel</label>
                                    <select
                                        id="relationship"
                                        name="relationship"
                                        value={formData.relationship}
                                        onChange={handleChange}
                                        style={styles.input}
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="En couple">En couple</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                        <option value="Divorcé(e)">Divorcé(e)</option>
                                        <option value="Veuf/Veuve">Veuf/Veuve</option>
                                        <option value="C'est compliqué">C'est compliqué</option>
                                    </select>
                                </div>
                            </div>

                            {/* Bio */}
                            <div style={styles.inputGroup}>
                                <label htmlFor="bio" style={styles.label}>Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Parlez-nous de vous..."
                                    style={styles.textarea}
                                />
                            </div>

                            {/* Centres d'intérêt */}
                            <div style={styles.inputGroup}>
                                <label htmlFor="interests" style={styles.label}>Centres d'intérêt</label>
                                <textarea
                                    id="interests"
                                    name="interests"
                                    value={formData.interests}
                                    onChange={handleChange}
                                    placeholder="Vos hobbies, passions, centres d'intérêt..."
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid #3a3b3c',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        backgroundColor: '#242526',
                                        color: '#e4e6ea',
                                        resize: 'vertical',
                                        minHeight: '120px',
                                        transition: 'border-color 0.2s, background-color 0.2s',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            {/* Boutons */}
                            <div style={styles.buttonGroup}>
                                <button 
                                    type="button" 
                                    onClick={handleCancelClick}
                                    disabled={saving}
                                    style={{
                                        ...styles.cancelButton,
                                        opacity: saving ? 0.7 : 1,
                                        cursor: saving ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    style={{
                                        ...styles.saveButton,
                                        opacity: saving ? 0.7 : 1,
                                        cursor: saving ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;