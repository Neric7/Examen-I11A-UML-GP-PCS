const validator = require('validator');
const { body } = require('express-validator');

// Validation pour la création d'un post
const validatePost = (req, res, next) => {
    const { content } = req.body;
    const errors = [];

    // Validation du contenu (optionnel si image présente)
    if (!content && !req.file) {
        errors.push('Le contenu ou une image est requis');
    }

    if (content && typeof content !== 'string') {
        errors.push('Le contenu doit être une chaîne de caractères');
    }

    if (content && content.trim().length === 0 && !req.file) {
        errors.push('Le contenu ne peut pas être vide si aucune image n\'est fournie');
    }

    if (content && content.length > 5000) {
        errors.push('Le contenu ne peut pas dépasser 5000 caractères');
    }

    // Validation de l'image (si présente)
    if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            errors.push('Type d\'image non autorisé');
        }

        if (req.file.size > 5 * 1024 * 1024) { // 5MB
            errors.push('L\'image ne peut pas dépasser 5MB');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors
        });
    }

    next();
};

// Validation pour la mise à jour d'un post
const validatePostUpdate = (req, res, next) => {
    const { content } = req.body;
    const errors = [];

    // Le contenu est requis pour la mise à jour
    if (!content) {
        errors.push('Le contenu est requis');
    }

    if (content && typeof content !== 'string') {
        errors.push('Le contenu doit être une chaîne de caractères');
    }

    if (content && content.trim().length === 0) {
        errors.push('Le contenu ne peut pas être vide');
    }

    if (content && content.length > 5000) {
        errors.push('Le contenu ne peut pas dépasser 5000 caractères');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors
        });
    }

    next();
};

// Validation pour l'authentification avec express-validator
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Format d\'email invalide')
        .normalizeEmail(),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreurs de validation',
                errors: errors.array().map(err => err.msg)
            });
        }
        next();
    }
];

// Validation pour l'inscription avec express-validator
const validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Le nom d\'utilisateur est requis')
        .isLength({ min: 3, max: 50 }).withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Format d\'email invalide')
        .normalizeEmail(),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 6, max: 128 }).withMessage('Le mot de passe doit contenir entre 6 et 128 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreurs de validation',
                errors: errors.array().map(err => err.msg)
            });
        }
        next();
    }
];

// Validation pour les commentaires
const validateComment = [
    body('content')
        .trim()
        .notEmpty().withMessage('Le contenu du commentaire est requis')
        .isLength({ max: 1000 }).withMessage('Le commentaire ne peut pas dépasser 1000 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreurs de validation',
                errors: errors.array().map(err => err.msg)
            });
        }
        next();
    }
];

// Validation pour les paramètres utilisateur
const validateUserSettings = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 150 }).withMessage('La bio ne peut pas dépasser 150 caractères'),
    
    (req, res, next) => {
        // Validation de l'avatar (si présent)
        if (req.file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: ['Type d\'image non autorisé pour l\'avatar']
                });
            }

            if (req.file.size > 2 * 1024 * 1024) { // 2MB
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: ['L\'avatar ne peut pas dépasser 2MB']
                });
            }
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreurs de validation',
                errors: errors.array().map(err => err.msg)
            });
        }
        next();
    }
];

// Validation pour le changement de mot de passe
const validatePasswordChange = [
    body('currentPassword')
        .trim()
        .notEmpty().withMessage('Le mot de passe actuel est requis'),
    
    body('newPassword')
        .trim()
        .notEmpty().withMessage('Le nouveau mot de passe est requis')
        .isLength({ min: 6, max: 128 }).withMessage('Le nouveau mot de passe doit contenir entre 6 et 128 caractères'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreurs de validation',
                errors: errors.array().map(err => err.msg)
            });
        }
        next();
    }
];

// Middleware pour valider les ObjectId MongoDB
const validateObjectId = (idName) => {
    return (req, res, next) => {
        if (!validator.isMongoId(req.params[idName])) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide',
                errors: [`Le paramètre ${idName} doit être un ID MongoDB valide`]
            });
        }
        next();
    };
};

module.exports = {
    validatePost,
    validatePostUpdate,
    validateLogin,
    validateRegister,
    validateComment,
    validateUserSettings,
    validatePasswordChange,
    validateObjectId
};