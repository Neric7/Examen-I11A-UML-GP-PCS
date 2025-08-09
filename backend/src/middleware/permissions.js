const db = require('../config/database');

// Vérifier que le post existe
const checkPostExists = async (req, res, next) => {
  try {
    // Récupérer postId depuis les paramètres ou le body
    const postId = req.params.postId || req.body.postId;
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'ID du post requis',
        errors: ['postId manquant dans les paramètres ou le body']
      });
    }
    
    const [posts] = await db.execute(
      'SELECT id, author_id FROM posts WHERE id = ? AND is_active = TRUE',
      [parseInt(postId)]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé',
        errors: ['Le post spécifié n\'existe pas ou a été supprimé']
      });
    }
    
    // Ajouter les infos du post à la requête
    req.post = posts[0];
    next();
    
  } catch (error) {
    console.error('Erreur dans checkPostExists:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du post',
      errors: [error.message]
    });
  }
};

// Vérifier la propriété d'un commentaire
const checkCommentOwnership = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: 'ID du commentaire requis',
        errors: ['commentId manquant']
      });
    }
    
    const [comments] = await db.execute(
      'SELECT id, author_id, post_id FROM comments WHERE id = ? AND is_active = TRUE',
      [parseInt(commentId)]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas ou a été supprimé']
      });
    }
    
    const comment = comments[0];
    
    if (comment.author_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        errors: ['Vous ne pouvez modifier que vos propres commentaires']
      });
    }
    
    req.comment = comment;
    next();
    
  } catch (error) {
    console.error('Erreur dans checkCommentOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions',
      errors: [error.message]
    });
  }
};

// Vérifier les permissions de modération
const checkModerationPermissions = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        errors: ['Seuls les administrateurs et modérateurs peuvent effectuer cette action']
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erreur dans checkModerationPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions',
      errors: [error.message]
    });
  }
};

// Vérifier la propriété du commentaire OU les permissions de modération
const checkCommentOwnershipOrModeration = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: 'ID du commentaire requis',
        errors: ['commentId manquant']
      });
    }
    
    const [comments] = await db.execute(
      'SELECT id, author_id, post_id FROM comments WHERE id = ? AND is_active = TRUE',
      [parseInt(commentId)]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas ou a été supprimé']
      });
    }
    
    const comment = comments[0];
    
    // Vérifier si l'utilisateur est propriétaire OU modérateur/admin
    const isOwner = comment.author_id === parseInt(userId);
    const isModerator = ['admin', 'moderator'].includes(userRole);
    
    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        errors: ['Vous ne pouvez modifier que vos propres commentaires']
      });
    }
    
    req.comment = comment;
    req.isModerator = isModerator;
    next();
    
  } catch (error) {
    console.error('Erreur dans checkCommentOwnershipOrModeration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions',
      errors: [error.message]
    });
  }
};

// Vérifier que le commentaire parent existe
const checkParentCommentExists = async (req, res, next) => {
  try {
    const { commentId } = req.params; // ID du commentaire parent
    const { postId } = req.body;
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: 'ID du commentaire parent requis',
        errors: ['commentId manquant']
      });
    }
    
    const [comments] = await db.execute(
      'SELECT id, post_id, author_id FROM comments WHERE id = ? AND is_active = TRUE',
      [parseInt(commentId)]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire parent non trouvé',
        errors: ['Le commentaire auquel vous tentez de répondre n\'existe pas']
      });
    }
    
    const parentComment = comments[0];
    
    // Vérifier que le commentaire parent appartient au même post
    if (postId && parentComment.post_id !== parseInt(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Incohérence des données',
        errors: ['Le commentaire parent n\'appartient pas au post spécifié']
      });
    }
    
    req.parentComment = parentComment;
    next();
    
  } catch (error) {
    console.error('Erreur dans checkParentCommentExists:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du commentaire parent',
      errors: [error.message]
    });
  }
};

// Vérifier les limites de signalement
const checkReportLimits = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    // Vérifier si l'utilisateur a déjà signalé ce commentaire
    const [existingReports] = await db.execute(
      'SELECT id FROM reports WHERE reporter_id = ? AND reported_item_type = "comment" AND reported_item_id = ?',
      [parseInt(userId), parseInt(commentId)]
    );
    
    if (existingReports.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Signalement déjà effectué',
        errors: ['Vous avez déjà signalé ce commentaire']
      });
    }
    
    // Vérifier le nombre de signalements de l'utilisateur dans les dernières 24h
    const [recentReports] = await db.execute(
      'SELECT COUNT(*) as count FROM reports WHERE reporter_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
      [parseInt(userId)]
    );
    
    if (recentReports[0].count >= 10) { // Limite de 10 signalements par jour
      return res.status(429).json({
        success: false,
        message: 'Limite de signalements atteinte',
        errors: ['Vous avez atteint la limite de signalements pour aujourd\'hui']
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erreur dans checkReportLimits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des limites',
      errors: [error.message]
    });
  }
};

// Vérifier les permissions de like (pas d'auto-like)
const checkLikePermissions = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    // Récupérer les infos du commentaire
    const [comments] = await db.execute(
      'SELECT id, author_id FROM comments WHERE id = ? AND is_active = TRUE',
      [parseInt(commentId)]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas']
      });
    }
    
    const comment = comments[0];
    
    // Empêcher l'auto-like
    if (comment.author_id === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Action non autorisée',
        errors: ['Vous ne pouvez pas liker vos propres commentaires']
      });
    }
    
    req.comment = comment;
    next();
    
  } catch (error) {
    console.error('Erreur dans checkLikePermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions de like',
      errors: [error.message]
    });
  }
};

// Middleware pour vérifier si l'utilisateur peut voir le commentaire
const checkCommentVisibility = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    
    const [comments] = await db.execute(`
      SELECT c.*, p.author_id as post_author_id
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ? AND c.is_active = TRUE AND p.is_active = TRUE
    `, [parseInt(commentId)]);
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
        errors: ['Le commentaire spécifié n\'existe pas ou n\'est pas accessible']
      });
    }
    
    req.comment = comments[0];
    next();
    
  } catch (error) {
    console.error('Erreur dans checkCommentVisibility:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la visibilité',
      errors: [error.message]
    });
  }
};

module.exports = {
  checkPostExists,
  checkCommentOwnership,
  checkModerationPermissions,
  checkCommentOwnershipOrModeration,
  checkParentCommentExists,
  checkReportLimits,
  checkLikePermissions,
  checkCommentVisibility
};