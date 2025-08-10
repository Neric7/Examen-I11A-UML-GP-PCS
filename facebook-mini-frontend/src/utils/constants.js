// Configuration de l'API
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Endpoints API
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  USER_POSTS: '/users/:id/posts',
  
  // Posts
  POSTS: '/posts',
  POST_LIKE: '/posts/:id/like',
  POST_UNLIKE: '/posts/:id/unlike',
  
  // Comments
  COMMENTS: '/posts/:id/comments',
  COMMENT_LIKE: '/comments/:id/like',
  COMMENT_UNLIKE: '/comments/:id/unlike',
  
  // Friends
  FRIENDS: '/friends',
  FRIEND_REQUESTS: '/friends/requests',
  SEND_FRIEND_REQUEST: '/friends/request/:id',
  ACCEPT_FRIEND_REQUEST: '/friends/accept/:id',
  REJECT_FRIEND_REQUEST: '/friends/reject/:id',
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Veuillez réessayer.',
  UNAUTHORIZED: 'Vous devez être connecté pour accéder à cette page.',
  FORBIDDEN: 'Vous n\'avez pas les permissions pour cette action.',
  NOT_FOUND: 'Ressource non trouvée.',
  VALIDATION_ERROR: 'Données invalides. Veuillez vérifier les champs.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  
  // Auth
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_EXISTS: 'Cet email est déjà utilisé.',
  WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 6 caractères.',
  
  // Posts
  POST_NOT_FOUND: 'Publication non trouvée.',
  EMPTY_POST: 'Le contenu de la publication ne peut pas être vide.',
  
  // Comments
  COMMENT_NOT_FOUND: 'Commentaire non trouvé.',
  EMPTY_COMMENT: 'Le commentaire ne peut pas être vide.',
  
  // Friends
  FRIEND_REQUEST_EXISTS: 'Une demande d\'ami existe déjà.',
  ALREADY_FRIENDS: 'Vous êtes déjà amis.',
  CANNOT_ADD_SELF: 'Vous ne pouvez pas vous ajouter vous-même.',
};

// Messages de succès
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie !',
  REGISTER_SUCCESS: 'Inscription réussie !',
  LOGOUT_SUCCESS: 'Déconnexion réussie !',
  
  POST_CREATED: 'Publication créée avec succès !',
  POST_UPDATED: 'Publication mise à jour !',
  POST_DELETED: 'Publication supprimée !',
  
  COMMENT_CREATED: 'Commentaire ajouté !',
  COMMENT_UPDATED: 'Commentaire mis à jour !',
  COMMENT_DELETED: 'Commentaire supprimé !',
  
  FRIEND_REQUEST_SENT: 'Demande d\'ami envoyée !',
  FRIEND_REQUEST_ACCEPTED: 'Demande d\'ami acceptée !',
  FRIEND_REQUEST_REJECTED: 'Demande d\'ami rejetée !',
  
  PROFILE_UPDATED: 'Profil mis à jour !',
};

// Constantes pour les validations
export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Veuillez entrer une adresse email valide.',
  },
  PASSWORD: {
    minLength: 6,
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  },
  NAME: {
    minLength: 2,
    maxLength: 50,
    message: 'Le nom doit contenir entre 2 et 50 caractères.',
  },
  POST_CONTENT: {
    maxLength: 2000,
    message: 'Le contenu ne peut pas dépasser 2000 caractères.',
  },
  COMMENT_CONTENT: {
    maxLength: 500,
    message: 'Le commentaire ne peut pas dépasser 500 caractères.',
  },
};

// Constantes pour les formats de date
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm',
};

// Constantes pour les tailles d'images
export const IMAGE_SIZES = {
  AVATAR: {
    width: 40,
    height: 40,
  },
  AVATAR_LARGE: {
    width: 80,
    height: 80,
  },
  POST_IMAGE: {
    maxWidth: 600,
    maxHeight: 400,
  },
  COVER_PHOTO: {
    width: 851,
    height: 315,
  },
};

// Types de notifications
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  MENTION: 'mention',
};

// Statuts des demandes d'amis
export const FRIEND_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

// Constantes pour le localStorage
export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'facebook_mini_token',
  REFRESH_TOKEN: 'facebook_mini_refresh_token',
  USER: 'facebook_mini_user',
  THEME: 'facebook_mini_theme',
};

// Délais (en millisecondes)
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 secondes
  DEBOUNCE: 300, // 300ms
  TOAST_DURATION: 3000, // 3 secondes
};