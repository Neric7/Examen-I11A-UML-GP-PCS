const Comment = require('../models/Comment');

// Créer un nouveau commentaire
const createComment = async (req, res) => {
  try {
    console.log('=== CRÉATION D\'UN COMMENTAIRE ===');
    console.log('Body reçu:', req.body);
    console.log('User:', req.user);
    console.log('Params:', req.params);
    
    const { content, postId, parentCommentId } = req.body;
    const authorId = req.user.id;
    
    // Validation des données
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est obligatoire',
        errors: ['Le commentaire ne peut pas être vide']
      });
    }
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du post est obligatoire',
        errors: ['postId manquant']
      });
    }
    
    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        errors: ['Token invalide ou expiré']
      });
    }
    
    // Créer le commentaire avec les bons noms de propriétés selon le schéma DB
    const commentData = {
      content: content.trim(),
      postId: parseInt(postId),
      authorId: parseInt(authorId), // Correspond à author_id dans la DB
      parentCommentId: parentCommentId ? parseInt(parentCommentId) : null // Correspond à parent_comment_id dans la DB
    };
    
    console.log('Données à envoyer au modèle:', commentData);
    
    const comment = await Comment.create(commentData);
    
    res.status(201).json({
      success: true,
      message: 'Commentaire créé avec succès',
      data: comment
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du commentaire:', error);
    
    if (error.message === 'Commentaire non trouvé') {
      return res.status(404).json({
        success: false,
        message: error.message,
        errors: [error.message]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du commentaire',
      errors: [error.message]
    });
  }
};

// Récupérer les commentaires d'un post
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'ID du post requis',
        errors: ['postId manquant']
      });
    }
    
    const result = await Comment.getByPost(postId, page, limit);
    
    res.json({
      success: true,
      data: result.comments,
      pagination: result.pagination
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commentaires',
      errors: [error.message]
    });
  }
};

// Récupérer un commentaire spécifique
const getComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: 'ID du commentaire requis',
        errors: ['commentId manquant']
      });
    }
    
    const comment = await Comment.getById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas']
      });
    }
    
    res.json({
      success: true,
      data: comment
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du commentaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du commentaire',
      errors: [error.message]
    });
  }
};

// Mettre à jour un commentaire
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est obligatoire',
        errors: ['Le commentaire ne peut pas être vide']
      });
    }
    
    const updatedComment = await Comment.update(commentId, content);
    
    res.json({
      success: true,
      message: 'Commentaire mis à jour avec succès',
      data: updatedComment
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du commentaire:', error);
    
    if (error.message === 'Commentaire non trouvé ou déjà supprimé') {
      return res.status(404).json({
        success: false,
        message: error.message,
        errors: [error.message]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du commentaire',
      errors: [error.message]
    });
  }
};

// Supprimer un commentaire
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    await Comment.delete(commentId);
    
    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    
    if (error.message === 'Commentaire non trouvé') {
      return res.status(404).json({
        success: false,
        message: error.message,
        errors: [error.message]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du commentaire',
      errors: [error.message]
    });
  }
};

// Répondre à un commentaire
const replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, postId } = req.body;
    const authorId = req.user.id;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le contenu de la réponse est obligatoire',
        errors: ['La réponse ne peut pas être vide']
      });
    }
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du post est obligatoire',
        errors: ['postId manquant']
      });
    }
    
    const replyData = {
      content: content.trim(),
      postId: parseInt(postId),
      authorId: parseInt(authorId),
      parentCommentId: parseInt(commentId)
    };
    
    const reply = await Comment.create(replyData);
    
    res.status(201).json({
      success: true,
      message: 'Réponse créée avec succès',
      data: reply
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réponse',
      errors: [error.message]
    });
  }
};

// Récupérer les réponses d'un commentaire
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    
    const result = await Comment.getReplies(commentId, page, limit);
    
    res.json({
      success: true,
      data: result.replies,
      pagination: result.pagination
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réponses',
      errors: [error.message]
    });
  }
};

// Liker un commentaire
const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    await Comment.like(commentId, userId);
    
    res.json({
      success: true,
      message: 'Commentaire liké avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors du like:', error);
    
    if (error.message === 'Vous avez déjà liké ce commentaire') {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: [error.message]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du like',
      errors: [error.message]
    });
  }
};

// Retirer le like d'un commentaire
const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    await Comment.unlike(commentId, userId);
    
    res.json({
      success: true,
      message: 'Like retiré avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors du unlike:', error);
    
    if (error.message === 'Like non trouvé') {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'avez pas liké ce commentaire',
        errors: ['Like non trouvé']
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du like',
      errors: [error.message]
    });
  }
};

// Récupérer les likes d'un commentaire
const getCommentLikes = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const query = `
      SELECT 
        cl.id,
        cl.like_date,
        u.id as user_id,
        u.username,
        u.profile_picture
      FROM comment_likes cl
      JOIN users u ON cl.user_id = u.id
      WHERE cl.comment_id = ?
      ORDER BY cl.like_date DESC
    `;
    
    const db = require('../config/database');
    const [likes] = await db.execute(query, [parseInt(commentId)]);
    
    res.json({
      success: true,
      data: likes,
      count: likes.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des likes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des likes',
      errors: [error.message]
    });
  }
};

// Signaler un commentaire
const reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'La raison du signalement est obligatoire',
        errors: ['reason manquant']
      });
    }
    
    const validReasons = ['spam', 'harassment', 'inappropriate', 'fake', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Raison de signalement invalide',
        errors: ['Raison doit être: ' + validReasons.join(', ')]
      });
    }
    
    const db = require('../config/database');
    await db.execute(`
      INSERT INTO reports (reporter_id, reported_item_type, reported_item_id, reason, description)
      VALUES (?, 'comment', ?, ?, ?)
    `, [parseInt(reporterId), parseInt(commentId), reason, description || null]);
    
    res.json({
      success: true,
      message: 'Commentaire signalé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors du signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement',
      errors: [error.message]
    });
  }
};

// Récupérer les commentaires d'un utilisateur
const getCommentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const db = require('../config/database');
    const query = `
      SELECT 
        c.*,
        u.username,
        u.profile_picture,
        p.content as post_content,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_active = TRUE) as replies_count
      FROM comments c
      JOIN users u ON c.author_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.author_id = ? AND c.is_active = TRUE
      ORDER BY c.comment_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const [comments] = await db.execute(query, [parseInt(userId), limit, offset]);
    
    // Compter le total
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM comments WHERE author_id = ? AND is_active = TRUE',
      [parseInt(userId)]
    );
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        totalComments: countResult[0].total,
        hasMore: countResult[0].total > page * limit
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commentaires',
      errors: [error.message]
    });
  }
};

// Récupérer les commentaires de l'utilisateur authentifié
const getMyComments = async (req, res) => {
  try {
    const userId = req.user.id;
    req.params.userId = userId;
    return getCommentsByUser(req, res);
  } catch (error) {
    console.error('Erreur lors de la récupération de mes commentaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos commentaires',
      errors: [error.message]
    });
  }
};

// Rechercher dans les commentaires
const searchComments = async (req, res) => {
  try {
    const { q: query, postId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis',
        errors: ['Paramètre q manquant']
      });
    }
    
    const db = require('../config/database');
    let sqlQuery = `
      SELECT 
        c.*,
        u.username,
        u.profile_picture,
        p.content as post_content,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_active = TRUE) as replies_count
      FROM comments c
      JOIN users u ON c.author_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.content LIKE ? AND c.is_active = TRUE
    `;
    
    const params = [`%${query.trim()}%`];
    
    if (postId) {
      sqlQuery += ' AND c.post_id = ?';
      params.push(parseInt(postId));
    }
    
    sqlQuery += ' ORDER BY c.comment_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [comments] = await db.execute(sqlQuery, params);
    
    res.json({
      success: true,
      data: comments,
      query: query.trim(),
      pagination: {
        currentPage: page,
        resultsCount: comments.length
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      errors: [error.message]
    });
  }
};

// Statistiques des commentaires d'un post
const getCommentStats = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const db = require('../config/database');
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(CASE WHEN parent_comment_id IS NULL THEN 1 END) as main_comments,
        COUNT(CASE WHEN parent_comment_id IS NOT NULL THEN 1 END) as replies,
        COUNT(DISTINCT author_id) as unique_commenters,
        (SELECT COUNT(*) FROM comment_likes cl JOIN comments c ON cl.comment_id = c.id WHERE c.post_id = ?) as total_likes
      FROM comments 
      WHERE post_id = ? AND is_active = TRUE
    `, [parseInt(postId), parseInt(postId)]);
    
    res.json({
      success: true,
      data: stats[0]
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      errors: [error.message]
    });
  }
};

// Épingler un commentaire (modération)
const pinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const db = require('../config/database');
    const [result] = await db.execute(
      'UPDATE comments SET is_pinned = TRUE, updated_at = NOW() WHERE id = ? AND is_active = TRUE',
      [parseInt(commentId)]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas']
      });
    }
    
    res.json({
      success: true,
      message: 'Commentaire épinglé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'épinglage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'épinglage',
      errors: [error.message]
    });
  }
};

// Désépingler un commentaire (modération)
const unpinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const db = require('../config/database');
    const [result] = await db.execute(
      'UPDATE comments SET is_pinned = FALSE, updated_at = NOW() WHERE id = ?',
      [parseInt(commentId)]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas']
      });
    }
    
    res.json({
      success: true,
      message: 'Commentaire désépinglé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors du désépinglage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du désépinglage',
      errors: [error.message]
    });
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  getComment,
  updateComment,
  deleteComment,
  replyToComment,
  getCommentReplies,
  likeComment,
  unlikeComment,
  getCommentLikes,
  reportComment,
  getCommentsByUser,
  getMyComments,
  searchComments,
  getCommentStats,
  pinComment,
  unpinComment
};