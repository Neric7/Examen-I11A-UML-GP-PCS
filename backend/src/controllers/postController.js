const db = require('../config/database');
const path = require('path');
const fs = require('fs');

class PostController {
    // Créer un nouveau post
    static async createPost(req, res) {
        const { content } = req.body;
        const userId = req.user.id;
        
        try {
            // Validation
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le contenu du post ne peut pas être vide'
                });
            }

            if (content.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: 'Le contenu ne peut pas dépasser 5000 caractères'
                });
            }

            let imageUrl = null;
            
            // Gestion de l'image si présente
            if (req.file) {
                imageUrl = req.file.filename;
            }

            // Insérer le post dans la base de données
            const query = `
                INSERT INTO posts (content, image_url, author_id) 
                VALUES (?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [content.trim(), imageUrl, userId]);
            
            // Récupérer le post créé avec les informations de l'auteur
            const [postData] = await db.execute(`
                SELECT 
                    p.*,
                    u.username,
                    u.profile_picture,
                    0 as user_liked
                FROM posts p
                JOIN users u ON p.author_id = u.id
                WHERE p.id = ? AND p.is_active = TRUE
            `, [result.insertId]);

            if (postData.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Erreur lors de la création du post'
                });
            }

            const post = postData[0];

            res.status(201).json({
                success: true,
                message: 'Post créé avec succès',
                post: {
                    id: post.id,
                    content: post.content,
                    image_url: post.image_url,
                    author: {
                        id: post.author_id,
                        username: post.username,
                        profile_picture: post.profile_picture
                    },
                    publication_date: post.publication_date,
                    likes_count: post.likes_count,
                    comments_count: post.comments_count,
                    user_liked: false
                }
            });

        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
            
            // Supprimer l'image si elle a été uploadée et qu'il y a une erreur
            if (req.file) {
                const imagePath = path.join(__dirname, '../../uploads/posts', req.file.filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Récupérer tous les posts
    static async getAllPosts(req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        try {
            const query = `
                SELECT 
                    p.*,
                    u.username,
                    u.profile_picture,
                    CASE 
                        WHEN l.id IS NOT NULL THEN TRUE 
                        ELSE FALSE 
                    END as user_liked
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = ?
                WHERE p.is_active = TRUE
                ORDER BY p.publication_date DESC
                LIMIT ? OFFSET ?
            `;

            const [posts] = await db.execute(query, [userId, limit, offset]);

            // Formater les données
            const formattedPosts = posts.map(post => ({
                id: post.id,
                content: post.content,
                image_url: post.image_url,
                author: {
                    id: post.author_id,
                    username: post.username,
                    profile_picture: post.profile_picture
                },
                publication_date: post.publication_date,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                user_liked: post.user_liked
            }));

            // Compter le total des posts
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM posts WHERE is_active = TRUE'
            );
            const total = countResult[0].total;

            res.json({
                success: true,
                posts: formattedPosts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des posts:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Récupérer un post par ID
    static async getPostById(req, res) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            const query = `
                SELECT 
                    p.*,
                    u.username,
                    u.profile_picture,
                    CASE 
                        WHEN l.id IS NOT NULL THEN TRUE 
                        ELSE FALSE 
                    END as user_liked
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = ?
                WHERE p.id = ? AND p.is_active = TRUE
            `;

            const [posts] = await db.execute(query, [userId, id]);

            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Post non trouvé'
                });
            }

            const post = posts[0];

            res.json({
                success: true,
                post: {
                    id: post.id,
                    content: post.content,
                    image_url: post.image_url,
                    author: {
                        id: post.author_id,
                        username: post.username,
                        profile_picture: post.profile_picture
                    },
                    publication_date: post.publication_date,
                    likes_count: post.likes_count,
                    comments_count: post.comments_count,
                    user_liked: post.user_liked
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du post:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Mettre à jour un post
    static async updatePost(req, res) {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        try {
            // Vérifier que le post existe et appartient à l'utilisateur
            const [existingPost] = await db.execute(
                'SELECT * FROM posts WHERE id = ? AND author_id = ? AND is_active = TRUE',
                [id, userId]
            );

            if (existingPost.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Post non trouvé ou vous n\'avez pas les permissions'
                });
            }

            // Validation
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le contenu du post ne peut pas être vide'
                });
            }

            if (content.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: 'Le contenu ne peut pas dépasser 5000 caractères'
                });
            }

            // Mettre à jour le post
            await db.execute(
                'UPDATE posts SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [content.trim(), id]
            );

            // Récupérer le post mis à jour
            const [updatedPost] = await db.execute(`
                SELECT 
                    p.*,
                    u.username,
                    u.profile_picture,
                    CASE 
                        WHEN l.id IS NOT NULL THEN TRUE 
                        ELSE FALSE 
                    END as user_liked
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = ?
                WHERE p.id = ?
            `, [userId, id]);

            const post = updatedPost[0];

            res.json({
                success: true,
                message: 'Post mis à jour avec succès',
                post: {
                    id: post.id,
                    content: post.content,
                    image_url: post.image_url,
                    author: {
                        id: post.author_id,
                        username: post.username,
                        profile_picture: post.profile_picture
                    },
                    publication_date: post.publication_date,
                    likes_count: post.likes_count,
                    comments_count: post.comments_count,
                    user_liked: post.user_liked
                }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour du post:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Supprimer un post
    static async deletePost(req, res) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            // Vérifier que le post existe et appartient à l'utilisateur
            const [existingPost] = await db.execute(
                'SELECT * FROM posts WHERE id = ? AND author_id = ? AND is_active = TRUE',
                [id, userId]
            );

            if (existingPost.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Post non trouvé ou vous n\'avez pas les permissions'
                });
            }

            const post = existingPost[0];

            // Supprimer logiquement le post
            await db.execute(
                'UPDATE posts SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );

            // Supprimer l'image associée si elle existe
            if (post.image_url) {
                const imagePath = path.join(__dirname, '../../uploads/posts', post.image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            res.json({
                success: true,
                message: 'Post supprimé avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression du post:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Liker/unliker un post
    static async toggleLike(req, res) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            // Vérifier que le post existe
            const [postExists] = await db.execute(
                'SELECT id FROM posts WHERE id = ? AND is_active = TRUE',
                [id]
            );

            if (postExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Post non trouvé'
                });
            }

            // Vérifier si l'utilisateur a déjà liké
            const [existingLike] = await db.execute(
                'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
                [userId, id]
            );

            let liked = false;

            if (existingLike.length > 0) {
                // Supprimer le like
                await db.execute(
                    'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
                    [userId, id]
                );
                
                // Décrémenter le compteur
                await db.execute(
                    'UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?',
                    [id]
                );
                
                liked = false;
            } else {
                // Ajouter le like
                await db.execute(
                    'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
                    [userId, id]
                );
                
                // Incrémenter le compteur
                await db.execute(
                    'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?',
                    [id]
                );
                
                liked = true;
            }

            res.json({
                success: true,
                liked,
                message: liked ? 'Post liké' : 'Like retiré'
            });

        } catch (error) {
            console.error('Erreur lors du toggle like:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }

    // Récupérer les posts d'un utilisateur
    static async getUserPosts(req, res) {
        const { userId: targetUserId } = req.params;
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        try {
            const query = `
                SELECT 
                    p.*,
                    u.username,
                    u.profile_picture,
                    CASE 
                        WHEN l.id IS NOT NULL THEN TRUE 
                        ELSE FALSE 
                    END as user_liked
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = ?
                WHERE p.author_id = ? AND p.is_active = TRUE
                ORDER BY p.publication_date DESC
                LIMIT ? OFFSET ?
            `;

            const [posts] = await db.execute(query, [userId, targetUserId, limit, offset]);

            // Formater les données
            const formattedPosts = posts.map(post => ({
                id: post.id,
                content: post.content,
                image_url: post.image_url,
                author: {
                    id: post.author_id,
                    username: post.username,
                    profile_picture: post.profile_picture
                },
                publication_date: post.publication_date,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                user_liked: post.user_liked
            }));

            // Compter le total des posts de l'utilisateur
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM posts WHERE author_id = ? AND is_active = TRUE',
                [targetUserId]
            );
            const total = countResult[0].total;

            res.json({
                success: true,
                posts: formattedPosts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des posts utilisateur:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    }
}

module.exports = PostController;