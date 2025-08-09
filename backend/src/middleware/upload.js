const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/posts');
        
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Générer un nom unique pour le fichier
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
    // Types MIME autorisés pour les images
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'), false);
    }
};

// Configuration de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB maximum
        files: 1 // Un seul fichier par requête
    },
    fileFilter: fileFilter
});

// Middleware de gestion des erreurs multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'Le fichier est trop volumineux. Taille maximum: 5MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Trop de fichiers. Un seul fichier autorisé'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Champ de fichier inattendu'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Erreur lors de l\'upload du fichier'
                });
        }
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Erreur lors de l\'upload du fichier'
        });
    }

    next();
};

// Wrapper pour gérer les erreurs multer
const uploadWithErrorHandling = (uploadFunction) => {
    return (req, res, next) => {
        uploadFunction(req, res, (err) => {
            handleMulterError(err, req, res, next);
        });
    };
};

module.exports = {
    single: (fieldName) => uploadWithErrorHandling(upload.single(fieldName)),
    array: (fieldName, maxCount) => uploadWithErrorHandling(upload.array(fieldName, maxCount)),
    fields: (fields) => uploadWithErrorHandling(upload.fields(fields)),
    none: () => uploadWithErrorHandling(upload.none())
};