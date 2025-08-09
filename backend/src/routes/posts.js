const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import your actual database connection and middleware
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

console.log('📍 Module posts.js chargé avec succès!');

// Create uploads/posts directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/posts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Dossier uploads/posts créé');
}

// Multer config: stockage des images dans /uploads/posts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});
router.get('/debug-token', (req, res) => {
    console.log('=== DEBUG TOKEN ===');
    console.log('Headers:', req.headers);
    console.log('Authorization:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    console.log('===================');
    
    res.json({
        message: 'Debug token',
        hasAuthHeader: !!req.headers.authorization,
        hasCookies: !!req.cookies.token,
        headers: req.headers
    });
});
// Route de test pour vérifier que le module posts fonctionne
router.get('/test', (req, res) => {
    res.json({
        message: 'Module posts fonctionne correctement!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/posts - Récupérer tous les posts',
            'GET /api/posts/:id - Récupérer un post par ID',
            'POST /api/posts - Créer un nouveau post',
            'POST /api/posts/:id/like - Liker/déliker un post',
            'DELETE /api/posts/:id - Supprimer un post'
        ]
    });
});

// Route de test temporaire pour créer un post sans auth (SUPPRIMER EN PRODUCTION)
router.post('/test-create', upload.single('image'), async (req, res) => {
    try {
        console.log('=== TEST CRÉATION POST SANS AUTH ===');
        const { content } = req.body;
        
        // Utiliser le premier utilisateur de la base pour test
        const [users] = await db.query('SELECT id, username FROM users LIMIT 1');
        
        if (users.length === 0) {
            return res.status(400).json({ message: 'Aucun utilisateur en base pour test' });
        }
        
        const testUser = users[0];
        console.log('Utilisateur de test:', testUser);
        
        const [result] = await db.query(
            'INSERT INTO posts (author_id, content, image_url) VALUES (?, ?, ?)',
            [testUser.id, content || 'Post de test', null]
        );
        
        console.log('Post créé avec ID:', result.insertId);
        
        res.json({
            message: 'Post de test créé!',
            postId: result.insertId,
            user: testUser
        });
        
    } catch (error) {
        console.error('Erreur test:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route GET /api/posts - Récupérer tous les posts
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('=== RÉCUPÉRATION DES POSTS ===');
        console.log('User ID:', req.user.userId);

        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Récupérer les posts avec les informations des auteurs
        const [posts] = await db.query(`
            SELECT 
                p.id,
                p.content,
                p.image_url as image,
                p.publication_date as createdAt,
                p.author_id,
                p.likes_count,
                p.comments_count,
                u.id as 'author.id',
                u.username as 'author.username',
                u.email as 'author.email',
                u.profile_picture as 'author.profilePicture',
                CASE WHEN user_likes.post_id IS NOT NULL THEN true ELSE false END as user_liked
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
            WHERE p.is_active = TRUE
            ORDER BY p.publication_date DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        // Restructurer les données
        const formattedPosts = posts.map(post => ({
            id: post.id,
            content: post.content,
            image: post.image,
            createdAt: post.createdAt,
            author_id: post.author_id,
            author: {
                id: post['author.id'],
                username: post['author.username'],
                email: post['author.email'],
                profilePicture: post['author.profilePicture']
            },
            likes_count: parseInt(post.likes_count || 0),
            comments_count: parseInt(post.comments_count || 0),
            user_liked: post.user_liked
        }));

        console.log(`${formattedPosts.length} posts récupérés`);
        console.log('=== FIN RÉCUPÉRATION DES POSTS ===');

        res.json(formattedPosts);

    } catch (error) {
        console.error('Erreur lors de la récupération des posts:', {
            message: error.message,
            stack: error.stack,
            user: req.user
        });

        res.status(500).json({ 
            message: 'Erreur serveur lors de la récupération des posts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route GET /api/posts/:id - Lire un post par ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        
        console.log('Récupération du post ID:', postId);

        const [posts] = await db.query(`
            SELECT 
                p.id,
                p.content,
                p.image_url as image,
                p.publication_date as createdAt,
                p.author_id,
                p.likes_count,
                p.comments_count,
                u.id as 'author.id',
                u.username as 'author.username',
                u.email as 'author.email',
                u.profile_picture as 'author.profilePicture',
                CASE WHEN user_likes.post_id IS NOT NULL THEN true ELSE false END as user_liked
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
            WHERE p.id = ? AND p.is_active = TRUE
        `, [userId, postId]);

        const post = posts[0];

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Post non trouvé" 
            });
        }

        const formattedPost = {
            id: post.id,
            content: post.content,
            image: post.image,
            createdAt: post.createdAt,
            author_id: post.author_id,
            author: {
                id: post['author.id'],
                username: post['author.username'],
                email: post['author.email'],
                profilePicture: post['author.profilePicture']
            },
            likes_count: parseInt(post.likes_count || 0),
            comments_count: parseInt(post.comments_count || 0),
            user_liked: post.user_liked
        };

        res.json({ success: true, post: formattedPost });
    } catch (error) {
        console.error('Erreur récupération post:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur serveur" 
        });
    }
});

// Route POST /api/posts - Créer un nouveau post
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        console.log('=== DÉBUT CRÉATION POST ===');
        console.log('User depuis middleware:', req.user);
        console.log('User ID:', req.user?.id);
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { content } = req.body;
        const userId = req.user?.userId; // Changé de req.user.id vers req.user.userId

        // Vérifier que req.user existe et a un ID
        if (!req.user || !userId) {
            console.log('❌ Utilisateur non authentifié ou ID manquant');
            return res.status(401).json({ 
                message: 'Utilisateur non authentifié' 
            });
        }

        // Validation
        if ((!content || content.trim() === '') && !req.file) {
            return res.status(400).json({ 
                message: 'Le contenu ou une image est requis' 
            });
        }

        if (content && content.trim().length > 5000) {
            return res.status(400).json({ 
                message: 'Le contenu ne peut pas dépasser 5000 caractères' 
            });
        }

        // Vérifier que l'utilisateur existe dans la base de données
        console.log('🔍 Vérification utilisateur ID:', userId);
        const [userExists] = await db.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [userId]
        );

        console.log('🔍 Résultat requête utilisateur:', userExists);

        if (userExists.length === 0) {
            console.log('❌ Utilisateur non trouvé dans la base de données avec ID:', userId);
            return res.status(404).json({ 
                message: 'Utilisateur non trouvé dans la base de données',
                debug: {
                    userId: userId,
                    userFromMiddleware: req.user
                }
            });
        }

        console.log('✅ Utilisateur trouvé:', userExists[0]);

        // Préparer les données du post
        let imageName = null;
        if (req.file) {
            // Générer un nom unique pour l'image
            const timestamp = Date.now();
            const extension = path.extname(req.file.originalname);
            imageName = `post_${userId}_${timestamp}${extension}`;
            
            // Renommer le fichier
            const oldPath = req.file.path;
            const newPath = path.join(path.dirname(oldPath), imageName);
            fs.renameSync(oldPath, newPath);
        }

        // Insérer le post dans la base de données
        const [result] = await db.query(
            'INSERT INTO posts (author_id, content, image_url) VALUES (?, ?, ?)',
            [userId, content?.trim() || '', imageName]
        );

        const postId = result.insertId;

        // Récupérer le post créé avec les informations de l'auteur
        const [rows] = await db.query(`
            SELECT 
                p.id,
                p.content,
                p.image_url as image,
                p.publication_date as createdAt,
                p.author_id,
                p.likes_count,
                p.comments_count,
                u.id as 'author.id',
                u.username as 'author.username',
                u.email as 'author.email',
                u.profile_picture as 'author.profilePicture',
                CASE WHEN user_likes.post_id IS NOT NULL THEN true ELSE false END as user_liked
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
            WHERE p.id = ? AND p.is_active = TRUE
        `, [userId, postId]);

        const newPost = rows[0];

        if (!newPost) {
            return res.status(500).json({ 
                message: 'Erreur lors de la récupération du post créé' 
            });
        }

        // Restructurer les données pour correspondre au format attendu
        const formattedPost = {
            id: newPost.id,
            content: newPost.content,
            image: newPost.image,
            createdAt: newPost.createdAt,
            author_id: newPost.author_id,
            author: {
                id: newPost['author.id'],
                username: newPost['author.username'],
                email: newPost['author.email'],
                profilePicture: newPost['author.profilePicture']
            },
            likes_count: parseInt(newPost.likes_count || 0),
            comments_count: parseInt(newPost.comments_count || 0),
            user_liked: newPost.user_liked
        };

        console.log('Post créé avec succès:', formattedPost);
        console.log('=== FIN CRÉATION POST ===');

        res.status(201).json({
            message: 'Post créé avec succès',
            post: formattedPost
        });

    } catch (error) {
        console.error('Erreur lors de la création du post:', {
            message: error.message,
            stack: error.stack,
            user: req.user,
            body: req.body,
            file: req.file
        });

        // Nettoyer le fichier uploadé en cas d'erreur
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur lors de la suppression du fichier:', unlinkError);
            }
        }

        // Gestion d'erreurs spécifiques
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                message: 'Utilisateur invalide' 
            });
        }

        if (error.code === 'ENOENT') {
            return res.status(500).json({ 
                message: 'Erreur de système de fichiers' 
            });
        }

        res.status(500).json({ 
            message: 'Erreur serveur lors de la création du post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route POST /api/posts/:id/like - Liker/déliker un post
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.userId;

        console.log(`=== LIKE/UNLIKE POST ${postId} par USER ${userId} ===`);

        // Vérifier si le post existe et est actif
        const [posts] = await db.query(
            'SELECT id, likes_count FROM posts WHERE id = ? AND is_active = TRUE',
            [postId]
        );

        const post = posts[0];

        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }

        // Vérifier si l'utilisateur a déjà liké ce post
        const [likes] = await db.query(
            'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        const existingLike = likes[0];

        let liked = false;
        let newLikesCount = parseInt(post.likes_count);

        if (existingLike) {
            // Retirer le like
            await db.query(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            
            newLikesCount = Math.max(0, newLikesCount - 1);
            liked = false;
            console.log('Like retiré');
        } else {
            // Ajouter le like
            await db.query(
                'INSERT INTO likes (post_id, user_id, like_date) VALUES (?, ?, NOW())',
                [postId, userId]
            );
            
            newLikesCount = newLikesCount + 1;
            liked = true;
            console.log('Like ajouté');
        }

        // Mettre à jour le compteur dans la table posts
        await db.query(
            'UPDATE posts SET likes_count = ? WHERE id = ?',
            [newLikesCount, postId]
        );

        console.log(`Nouveau nombre de likes: ${newLikesCount}`);
        console.log('=== FIN LIKE/UNLIKE ===');

        res.json({
            liked: liked,
            likes_count: newLikesCount
        });

    } catch (error) {
        console.error('Erreur lors du like/unlike:', {
            message: error.message,
            stack: error.stack,
            postId: req.params.id,
            userId: req.user?.userId
        });

        res.status(500).json({ 
            message: 'Erreur serveur lors du like/unlike',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route DELETE /api/posts/:id - Supprimer un post (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;

        console.log(`Suppression du post ${postId} par l'utilisateur ${userId}`);

        // Vérifier que le post existe et appartient à l'utilisateur
        const [posts] = await db.query(
            'SELECT id, author_id FROM posts WHERE id = ? AND is_active = TRUE',
            [postId]
        );

        const post = posts[0];

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Post non trouvé" 
            });
        }

        if (post.author_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: "Non autorisé à supprimer ce post" 
            });
        }

        // Soft delete - marquer le post comme inactif
        await db.query(
            'UPDATE posts SET is_active = FALSE WHERE id = ?',
            [postId]
        );

        console.log(`Post ${postId} marqué comme supprimé`);

        res.json({ 
            success: true, 
            message: "Post supprimé avec succès" 
        });

    } catch (error) {
        console.error('Erreur suppression post:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur serveur lors de la suppression" 
        });
    }
});

// Route PUT /api/posts/:id - Modifier un post existant
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        console.log('=== DÉBUT MODIFICATION POST ===');
        const postId = req.params.id;
        const userId = req.user.userId;
        const { content } = req.body;

        console.log('Post ID à modifier:', postId);
        console.log('User ID:', userId);
        console.log('Nouveau contenu:', content);
        console.log('Nouvelle image:', req.file);

        // Vérifier que le post existe et appartient à l'utilisateur
        const [posts] = await db.query(
            'SELECT id, author_id, content, image_url FROM posts WHERE id = ? AND is_active = TRUE',
            [postId]
        );

        const post = posts[0];

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: "Post non trouvé" 
            });
        }

        if (post.author_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: "Non autorisé à modifier ce post" 
            });
        }

        // Validation du contenu
        if ((!content || content.trim() === '') && !req.file && !post.image_url) {
            return res.status(400).json({ 
                message: 'Le contenu ou une image est requis' 
            });
        }

        if (content && content.trim().length > 5000) {
            return res.status(400).json({ 
                message: 'Le contenu ne peut pas dépasser 5000 caractères' 
            });
        }

        // Gérer l'image
        let newImageName = post.image_url; // Garder l'ancienne image par défaut

        if (req.file) {
            // Supprimer l'ancienne image si elle existe
            if (post.image_url) {
                const oldImagePath = path.join(uploadsDir, post.image_url);
                try {
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                        console.log('Ancienne image supprimée:', post.image_url);
                    }
                } catch (error) {
                    console.error('Erreur suppression ancienne image:', error);
                }
            }

            // Générer un nom unique pour la nouvelle image
            const timestamp = Date.now();
            const extension = path.extname(req.file.originalname);
            newImageName = `post_${userId}_${timestamp}${extension}`;
            
            // Renommer le fichier
            const oldPath = req.file.path;
            const newPath = path.join(path.dirname(oldPath), newImageName);
            fs.renameSync(oldPath, newPath);
            console.log('Nouvelle image sauvegardée:', newImageName);
        }

        // Mettre à jour le post dans la base de données
        const updateQuery = 'UPDATE posts SET content = ?, image_url = ?, updated_at = NOW() WHERE id = ?';
        const updateParams = [content?.trim() || post.content, newImageName, postId];

        await db.query(updateQuery, updateParams);

        // Récupérer le post modifié avec les informations de l'auteur
        const [updatedRows] = await db.query(`
            SELECT 
                p.id,
                p.content,
                p.image_url as image,
                p.publication_date as createdAt,
                p.updated_at as updatedAt,
                p.author_id,
                p.likes_count,
                p.comments_count,
                u.id as 'author.id',
                u.username as 'author.username',
                u.email as 'author.email',
                u.profile_picture as 'author.profilePicture',
                CASE WHEN user_likes.post_id IS NOT NULL THEN true ELSE false END as user_liked
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
            WHERE p.id = ? AND p.is_active = TRUE
        `, [userId, postId]);

        const updatedPost = updatedRows[0];

        if (!updatedPost) {
            return res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la récupération du post modifié' 
            });
        }

        // Restructurer les données pour correspondre au format attendu
        const formattedPost = {
            id: updatedPost.id,
            content: updatedPost.content,
            image: updatedPost.image,
            createdAt: updatedPost.createdAt,
            updatedAt: updatedPost.updatedAt,
            author_id: updatedPost.author_id,
            author: {
                id: updatedPost['author.id'],
                username: updatedPost['author.username'],
                email: updatedPost['author.email'],
                profilePicture: updatedPost['author.profilePicture']
            },
            likes_count: parseInt(updatedPost.likes_count || 0),
            comments_count: parseInt(updatedPost.comments_count || 0),
            user_liked: updatedPost.user_liked
        };

        console.log('Post modifié avec succès:', formattedPost);
        console.log('=== FIN MODIFICATION POST ===');

        res.json({
            success: true,
            message: 'Post modifié avec succès',
            post: formattedPost
        });

    } catch (error) {
        console.error('Erreur lors de la modification du post:', {
            message: error.message,
            stack: error.stack,
            postId: req.params.id,
            userId: req.user?.userId,
            body: req.body,
            file: req.file
        });

        // Nettoyer le fichier uploadé en cas d'erreur
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur lors de la suppression du fichier:', unlinkError);
            }
        }

        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur lors de la modification du post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
module.exports = router;