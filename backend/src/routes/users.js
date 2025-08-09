// ============================================
// src/routes/users.js
// ============================================
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/profile-pictures';
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Générer un nom unique pour le fichier
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

// Filtrer les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seuls JPG, PNG et GIF sont acceptés.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// ============================================
// ROUTES PUBLIQUES
// ============================================

// Route pour obtenir tous les utilisateurs (utile pour les tests/admin)
router.get('/', async (req, res) => {
    try {
        console.log('Requête GET /api/users reçue.');
        const [users] = await db.execute(`
            SELECT id, username, email, profile_picture, registration_date, bio, 
                   firstName, lastName, city, country, is_active 
            FROM users 
            ORDER BY registration_date DESC
        `);
        console.log('Utilisateurs récupérés:', users.length);
        
        // Transformer profile_picture en profilePicture pour la cohérence frontend
        const formattedUsers = users.map(user => ({
            ...user,
            profilePicture: user.profile_picture
        }));
        
        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs' });
    }
});

// Route pour obtenir un utilisateur par ID (publique pour les profils)
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        console.log(`Requête GET /api/users/${userId} reçue.`);

        if (isNaN(userId)) {
            console.log(`ID utilisateur invalide: ${userId}`);
            return res.status(400).json({ message: 'ID utilisateur invalide' });
        }

        const [users] = await db.execute(`
            SELECT 
                id, username, email, firstName, lastName, phone, 
                dateOfBirth, city, country, website, occupation, 
                relationship, interests, bio, profile_picture,
                registration_date, last_login, is_active
            FROM users 
            WHERE id = ? AND is_active = 1
        `, [userId]);

        if (users.length === 0) {
            console.log(`Utilisateur avec l'ID ${userId} non trouvé.`);
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = users[0];
        // Transformer profile_picture en profilePicture pour la cohérence frontend
        user.profilePicture = user.profile_picture;
        delete user.profile_picture;

        console.log('Utilisateur trouvé:', user.username);
        res.status(200).json({ user });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur par ID:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur' });
    }
});

// Route pour servir les images de profil
router.get('/uploads/profile-pictures/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'profile-pictures', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'Image non trouvée' });
    }
});

// ============================================
// ROUTES PROTÉGÉES
// ============================================

// Route pour obtenir son propre profil complet (avec données sensibles)
router.get('/:id/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        console.log(`Requête GET /api/users/${userId}/profile reçue.`);
        
        // Vérifier que l'utilisateur ne peut accéder qu'à son propre profil
        if (parseInt(req.user.userId) !== parseInt(userId)) {
            console.log(`Autorisation refusée: User ${req.user.userId} tente d'accéder au profil de ${userId}.`);
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const [users] = await db.execute(`
            SELECT 
                id, username, email, firstName, lastName, phone, 
                dateOfBirth, city, country, website, occupation, 
                relationship, interests, bio, profile_picture,
                registration_date, last_login, is_active
            FROM users 
            WHERE id = ?
        `, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = users[0];
        // Transformer profile_picture en profilePicture pour la cohérence frontend
        user.profilePicture = user.profile_picture;
        delete user.profile_picture;
        
        console.log(`Profil complet récupéré pour User ID: ${req.user.userId}`);
        res.json({ user });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le profil utilisateur
router.put('/:id', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;
        console.log(`Requête PUT /api/users/${userIdToUpdate} reçue.`);
        console.log('Données reçues pour mise à jour:', req.body);
        
        // --- Étape d'autorisation ---
        if (parseInt(req.user.userId) !== parseInt(userIdToUpdate)) {
            console.log(`Autorisation refusée: User ${req.user.userId} tente de modifier le profil de ${userIdToUpdate}.`);
            return res.status(403).json({ message: 'Accès refusé: Vous ne pouvez modifier que votre propre profil.' });
        }
        console.log(`Autorisation acceptée pour User ID: ${req.user.userId}`);

        const {
            username, email, firstName, lastName, phone,
            dateOfBirth, city, country, website, occupation,
            relationship, interests, bio
        } = req.body;

        // Validation des données requises
        if (!username || !email) {
            return res.status(400).json({ message: 'Le nom d\'utilisateur et l\'email sont requis' });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format d\'email invalide' });
        }

        // Validation de la date de naissance (optionnel)
        if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
            return res.status(400).json({ message: 'La date de naissance ne peut pas être dans le futur' });
        }

        // Validation de l'URL du site web (optionnel)
        if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
            return res.status(400).json({ message: 'L\'URL du site web doit commencer par http:// ou https://' });
        }

        // Vérifier l'unicité du nom d'utilisateur
        if (username) {
            const [existingUsername] = await db.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, userIdToUpdate]);
            if (existingUsername.length > 0) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris par un autre compte.' });
            }
        }

        // Vérifier l'unicité de l'email
        if (email) {
            const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userIdToUpdate]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
            }
        }

        // Récupérer l'ancien profil pour gérer la suppression de l'ancienne image
        const [existingUser] = await db.execute('SELECT profile_picture FROM users WHERE id = ?', [userIdToUpdate]);
        
        // Construire la requête de mise à jour
        let updateQuery = `
            UPDATE users SET 
                username = ?, email = ?, firstName = ?, lastName = ?, 
                phone = ?, dateOfBirth = ?, city = ?, country = ?, 
                website = ?, occupation = ?, relationship = ?, 
                interests = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
        `;
        
        let queryParams = [
            username, email, firstName || null, lastName || null,
            phone || null, dateOfBirth || null, city || null, country || null,
            website || null, occupation || null, relationship || null,
            interests || null, bio || null
        ];

        // Ajouter l'image de profil si un fichier a été uploadé
        if (req.file) {
            updateQuery += ', profile_picture = ?';
            queryParams.push(req.file.filename);
            
            // Supprimer l'ancienne image si elle existe
            if (existingUser[0] && existingUser[0].profile_picture) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', 'profile-pictures', existingUser[0].profile_picture);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(userIdToUpdate);

        console.log('SQL UPDATE query:', updateQuery);
        console.log('SQL UPDATE values:', queryParams);

        // Exécuter la mise à jour
        const [result] = await db.execute(updateQuery, queryParams);

        if (result.affectedRows === 0) {
            console.log(`Aucune ligne affectée pour la mise à jour de l'utilisateur ${userIdToUpdate}.`);
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification appliquée.' });
        }

        // Récupérer les données mises à jour
        const [updatedUsers] = await db.execute(`
            SELECT 
                id, username, email, firstName, lastName, phone, 
                dateOfBirth, city, country, website, occupation, 
                relationship, interests, bio, profile_picture,
                registration_date, last_login, is_active
            FROM users 
            WHERE id = ?
        `, [userIdToUpdate]);

        const updatedUser = updatedUsers[0];
        // Transformer profile_picture en profilePicture pour la cohérence frontend
        updatedUser.profilePicture = updatedUser.profile_picture;
        delete updatedUser.profile_picture;

        console.log('Profil utilisateur mis à jour avec succès:', updatedUser.username);
        res.status(200).json({ 
            message: 'Profil mis à jour avec succès',
            user: updatedUser 
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
        
        // Supprimer le fichier uploadé en cas d'erreur
        if (req.file) {
            const filePath = path.join(__dirname, '..', 'uploads', 'profile-pictures', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ce nom d\'utilisateur ou email est déjà utilisé' });
        }
        
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
    }
});

// ============================================
// MIDDLEWARE DE GESTION D'ERREURS
// ============================================

// Middleware de gestion des erreurs pour multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Le fichier est trop volumineux (max 5MB)' });
        }
        return res.status(400).json({ message: 'Erreur lors de l\'upload du fichier' });
    }
    
    if (error.message === 'Type de fichier non autorisé. Seuls JPG, PNG et GIF sont acceptés.') {
        return res.status(400).json({ message: error.message });
    }
    
    next(error);
});

module.exports = router;