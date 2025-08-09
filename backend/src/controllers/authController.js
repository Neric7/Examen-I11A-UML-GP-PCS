// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');

// Configuration multer pour l'upload de photos de profil
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
    
    // Créer le dossier s'il n'existe pas
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Erreur création dossier:', error);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum
  },
  fileFilter: (req, file, cb) => {
    // Vérifier que c'est bien une image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (JPG, PNG, GIF, etc.)'));
    }
  }
});

// Middleware pour l'upload de photo de profil
const uploadProfilePicture = upload.single('profilePicture');

// Fonction d'inscription
const register = async (req, res) => {
  try {
    console.log('=== DÉBUT INSCRIPTION ===');
    console.log('Body reçu:', req.body);
    console.log('Fichier reçu:', req.file ? req.file.filename : 'Aucun fichier');

    const { username, email, password, phone, bio } = req.body;

    // Validation des champs obligatoires
    if (!username || !email || !password) {
      console.log('Champs manquants:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis (nom d\'utilisateur, email, mot de passe)'
      });
    }

    // Trim des valeurs
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validation des données
    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
      });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        message: 'Format d\'email invalide'
      });
    }

    // Validation téléphone si fourni
    if (phone && phone.trim() && !/^[+]?[\d\s\-()]+$/.test(phone.trim())) {
      return res.status(400).json({
        message: 'Format de numéro de téléphone invalide'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    console.log('Vérification utilisateur existant...');
    const existingUser = await User.findByEmail(trimmedEmail);
    if (existingUser) {
      console.log('Email déjà utilisé:', trimmedEmail);
      return res.status(400).json({
        message: 'Un compte avec cet email existe déjà'
      });
    }

    const existingUsername = await User.findByUsername(trimmedUsername);
    if (existingUsername) {
      console.log('Nom d\'utilisateur déjà pris:', trimmedUsername);
      return res.status(400).json({
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
    }

    // Hasher le mot de passe
    console.log('Hashage du mot de passe...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);

    // Préparer les données utilisateur
    const userData = {
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      phone: phone && phone.trim() ? phone.trim() : null,
      bio: bio && bio.trim() ? bio.trim() : null,
      profile_picture: req.file ? req.file.filename : null
    };

    console.log('Données utilisateur à créer:', {
      ...userData,
      password: '[MASQUÉ]'
    });

    // Créer l'utilisateur
    const newUser = await User.create(userData);
    console.log('Utilisateur créé avec ID:', newUser.id);

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username,
        email: newUser.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Réponse de succès
    res.status(201).json({
      message: 'Inscription réussie !',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        bio: newUser.bio,
        profile_picture: newUser.profile_picture
      },
      token
    });

    console.log('=== INSCRIPTION TERMINÉE AVEC SUCCÈS ===');

  } catch (error) {
    console.error('=== ERREUR LORS DE L\'INSCRIPTION ===');
    console.error('Stack trace:', error.stack);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log('Fichier supprimé après erreur:', req.file.filename);
      } catch (unlinkError) {
        console.error('Erreur suppression fichier:', unlinkError);
      }
    }

    // Gérer les erreurs spécifiques
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        message: 'Erreur de configuration du serveur (dossier uploads)'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: 'Erreur serveur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fonction de connexion (existante)
const login = async (req, res) => {
  try {
    console.log('=== DÉBUT CONNEXION ===');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email et mot de passe requis'
      });
    }

    const user = await User.findByEmail(email.trim());
    if (!user) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        profile_picture: user.profile_picture
      },
      token
    });

    console.log('=== CONNEXION RÉUSSIE ===');

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Fonction pour servir les images de profil
const getProfilePicture = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'profiles', filename);

    // Vérifier si le fichier existe
    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({
        message: 'Image non trouvée'
      });
    }

    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
    res.sendFile(filepath);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};

// Fonction pour supprimer une image de profil
const deleteProfilePicture = async (filename) => {
  try {
    if (!filename) return;
    
    const filepath = path.join(__dirname, '..', 'uploads', 'profiles', filename);
    await fs.unlink(filepath);
    console.log('Image supprimée:', filename);
  } catch (error) {
    console.error('Erreur suppression image:', error);
  }
};

module.exports = {
  uploadProfilePicture,
  register,
  login,
  getProfilePicture,
  deleteProfilePicture
};