// ============================================
// src/routes/auth.js
// ============================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-pictures';
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  }
});

// Route d'inscription avec support pour l'upload de fichier
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    try {
        const { username, email, password, phone, bio } = req.body;
        const profilePicture = req.file;

        console.log('Register request received for:', { username, email, phone, bio });
        console.log('Profile picture uploaded:', profilePicture ? profilePicture.filename : 'None');

        // Validation basique
        if (!username || !email || !password) {
            console.log('Validation failed: Missing required fields');
            // Supprimer le fichier uploadé si la validation échoue
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            return res.status(400).json({ 
                message: 'Nom d\'utilisateur, email et mot de passe sont requis' 
            });
        }

        // Validation du nom d'utilisateur (minimum 3 caractères)
        if (username.trim().length < 3) {
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            return res.status(400).json({ 
                message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' 
            });
        }

        // Validation du mot de passe (minimum 6 caractères)
        if (password.length < 6) {
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            return res.status(400).json({ 
                message: 'Le mot de passe doit contenir au moins 6 caractères' 
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            return res.status(400).json({ 
                message: 'Veuillez entrer un email valide' 
            });
        }

        // Validation du téléphone si fourni
        if (phone && phone.trim() && !/^[+]?[\d\s\-()]+$/.test(phone.trim())) {
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            return res.status(400).json({ 
                message: 'Veuillez entrer un numéro de téléphone valide' 
            });
        }

        // Vérifier si l'utilisateur existe déjà
        console.log('Checking for existing user with email:', email, 'or username:', username);
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email.trim(), username.trim()]
        );
        console.log('Existing users query result:', existingUsers);

        if (existingUsers.length > 0) {
            console.log('User already exists, returning 400.');
            // Supprimer le fichier uploadé si l'utilisateur existe déjà
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            return res.status(400).json({ 
                message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' 
            });
        }

        // Hacher le mot de passe
        console.log('Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Password hashed successfully.');

        // Préparer les données pour l'insertion
        const profilePicturePath = profilePicture ? profilePicture.filename : null;
        const phoneValue = phone && phone.trim() ? phone.trim() : null;
        const bioValue = bio && bio.trim() ? bio.trim() : null;

        // Créer l'utilisateur avec tous les champs
        console.log('Attempting to insert user into DB...');
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, phone, bio, profile_picture) VALUES (?, ?, ?, ?, ?, ?)',
            [username.trim(), email.trim(), hashedPassword, phoneValue, bioValue, profilePicturePath]
        );
        console.log('DB Insert result:', result);

        // Vérifier si l'insertion a réussi
        if (result && result.insertId) {
            console.log(`User successfully inserted with ID: ${result.insertId}`);
        } else {
            console.warn('Warning: Insert operation did not return an insertId.');
            // Supprimer le fichier uploadé si l'insertion échoue
            if (profilePicture) {
                fs.unlinkSync(profilePicture.path);
            }
            throw new Error('Échec de l\'insertion en base de données');
        }
        
        // Créer le token JWT
        const token = jwt.sign(
            { userId: result.insertId, email: email.trim() },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        console.log('JWT token created. Sending 201 response.');
        res.status(201).json({
            message: 'Inscription réussie',
            token,
            user: {
                id: result.insertId,
                username: username.trim(),
                email: email.trim(),
                phone: phoneValue,
                bio: bioValue,
                profile_picture: profilePicturePath
            }
        });

    } catch (error) {
        console.error('❌ Erreur inscription (caught in try-catch):', error);
        
        // Supprimer le fichier uploadé en cas d'erreur
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (deleteError) {
                console.error('Erreur lors de la suppression du fichier:', deleteError);
            }
        }

        // Gestion des erreurs spécifiques
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'L\'image doit faire moins de 5MB' 
            });
        }
        
        if (error.message === 'Seules les images sont autorisées!') {
            return res.status(400).json({ 
                message: 'Veuillez sélectionner une image valide' 
            });
        }

        // Ajouter plus de détails pour le debug
        if (error.sqlState) console.error('SQL State:', error.sqlState);
        if (error.code) console.error('Error Code:', error.code);
        if (error.message) console.error('Error Message:', error.message);

        res.status(500).json({ 
            message: 'Erreur serveur lors de l\'inscription',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong!'
        });
    }
});

// Route de connexion (inchangée)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email et mot de passe requis' 
            });
        }

        // Trouver l'utilisateur
        const [users] = await db.execute(
            'SELECT id, username, email, password_hash, profile_picture, phone, bio FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                message: 'Identifiants invalides' 
            });
        }

        const user = users[0];

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ 
                message: 'Identifiants invalides' 
            });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                bio: user.bio,
                profile_picture: user.profile_picture
            }
        });

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ 
            message: 'Erreur serveur lors de la connexion' 
        });
    }
});

// Route pour servir les images de profil
router.get('/profile-picture/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/profile-pictures', filename);
    
    // Vérifier si le fichier existe
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).json({ message: 'Image non trouvée' });
    }
});

// Route pour mettre à jour le profil utilisateur (inchangée)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;
        const { username, email, bio, profile_picture } = req.body;

        console.log(`Requête PUT /api/users/${userIdToUpdate} reçue.`);
        console.log('Données reçues pour mise à jour:', req.body);

        // Vérifier l'autorisation
        if (parseInt(req.user.userId) !== parseInt(userIdToUpdate)) {
            console.log(`Autorisation refusée: User ${req.user.userId} tente de modifier le profil de ${userIdToUpdate}.`);
            return res.status(403).json({ message: 'Accès refusé: Vous ne pouvez modifier que votre propre profil.' });
        }
        console.log(`Autorisation acceptée pour User ID: ${req.user.userId}`);

        // Construire dynamiquement la requête SQL
        let updateFields = [];
        let updateValues = [];

        if (username) {
            const [existingUsername] = await db.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, userIdToUpdate]);
            if (existingUsername.length > 0) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris par un autre compte.' });
            }
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        if (email) {
            const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userIdToUpdate]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
            }
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (bio !== undefined) {
            updateFields.push('bio = ?');
            updateValues.push(bio);
        }
        if (profile_picture !== undefined) {
            updateFields.push('profile_picture = ?');
            updateValues.push(profile_picture);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée fournie pour la mise à jour.' });
        }

        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        updateValues.push(userIdToUpdate);

        console.log('SQL UPDATE query:', query);
        console.log('SQL UPDATE values:', updateValues);

        const [result] = await db.execute(query, updateValues);

        if (result.affectedRows === 0) {
            console.log(`Aucune ligne affectée pour la mise à jour de l'utilisateur ${userIdToUpdate}.`);
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification appliquée.' });
        }

        // Récupérer les données utilisateur mises à jour
        const [updatedUsers] = await db.execute(
            'SELECT id, username, email, profile_picture, registration_date, bio, phone FROM users WHERE id = ?',
            [userIdToUpdate]
        );

        res.status(200).json({
            message: 'Profil utilisateur mis à jour avec succès',
            user: updatedUsers[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
    }
});

router.post("/verify", (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    console.error("Erreur de vérification du token :", err.message);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
});

// Route pour vérifier le token (appelée par AuthContext)
router.get('/verify', async (req, res) => {
    try {
        // Récupérer le token depuis l'en-tête Authorization ou les cookies
        let token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Token manquant' 
            });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Récupérer les informations utilisateur depuis la base
        const [users] = await db.query(
            'SELECT id, username, email, profile_picture FROM users WHERE id = ?',
            [decoded.id || decoded.userId]
        );

        const user = users[0];

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profile_picture
            }
        });

    } catch (error) {
        console.error('❌ Erreur vérification token:', error.message);
        res.status(401).json({ 
            success: false,
            message: 'Token invalide',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
module.exports = router;