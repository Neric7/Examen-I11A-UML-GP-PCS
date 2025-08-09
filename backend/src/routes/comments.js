const express = require('express');
const router = express.Router();

// Import des contrôleurs de commentaires
const commentController = require('../controllers/commentController');

// Import des middlewares de permissions
const {
    checkPostExists,
    checkCommentOwnership,
    checkModerationPermissions,
    checkCommentOwnershipOrModeration,
    checkParentCommentExists,
    checkReportLimits,
    checkLikePermissions
} = require('../middleware/permissions');

// Import du middleware d'authentification (à implémenter ou utiliser depuis votre module auth)
// Assurez-vous d'avoir un middleware 'authenticateToken' qui ajoute req.user.id
// ❌ Ce fichier n'existe pas ou le chemin est incorrect
const { authenticateToken } = require('../middleware/authenticateToken');

console.log('✅ comments.js chargé');

// --- Routes pour les commentaires ---

// GET /api/comments - Route de test simple (peut être supprimée ou modifiée)
router.get('/', (req, res) => {
    res.json({ message: 'Route comments fonctionne !' });
});

// POST /api/comments - Créer un nouveau commentaire sur un post
// Requiert l'authentification et vérifie que le post existe
router.post(
    '/',
    authenticateToken,
    checkPostExists,
    commentController.createComment
);

// GET /api/comments/post/:postId - Récupérer tous les commentaires d'un post avec pagination
router.get(
    '/post/:postId',
    commentController.getCommentsByPost
);

// GET /api/comments/:commentId - Récupérer un commentaire spécifique
router.get(
    '/:commentId',
    commentController.getComment
);

// PUT /api/comments/:commentId - Modifier un commentaire
// Requiert l'authentification et la propriété du commentaire ou les permissions de modération
router.put(
    '/:commentId',
    authenticateToken,
    checkCommentOwnershipOrModeration, // Prioritize this one as it covers both
    commentController.updateComment
);

// DELETE /api/comments/:commentId - Supprimer un commentaire
// Requiert l'authentification et la propriété du commentaire ou les permissions de modération
router.delete(
    '/:commentId',
    authenticateToken,
    checkCommentOwnershipOrModeration, // Prioritize this one
    commentController.deleteComment
);

// POST /api/comments/:commentId/reply - Répondre à un commentaire
// Requiert l'authentification et vérifie que le commentaire parent existe
router.post(
    '/:commentId/reply',
    authenticateToken,
    checkParentCommentExists,
    commentController.replyToComment
);

// GET /api/comments/:commentId/replies - Récupérer les réponses d'un commentaire
router.get(
    '/:commentId/replies',
    commentController.getCommentReplies
);

// POST /api/comments/:commentId/like - Liker un commentaire
// Requiert l'authentification et vérifie les permissions de like (pas d'auto-like)
router.post(
    '/:commentId/like',
    authenticateToken,
    checkLikePermissions,
    commentController.likeComment
);

// POST /api/comments/:commentId/unlike - Retirer le like d'un commentaire
// Requiert l'authentification
router.post(
    '/:commentId/unlike',
    authenticateToken,
    commentController.unlikeComment
);

// GET /api/comments/:commentId/likes - Récupérer les likes d'un commentaire
router.get(
    '/:commentId/likes',
    commentController.getCommentLikes
);

// POST /api/comments/:commentId/report - Signaler un commentaire
// Requiert l'authentification et vérifie les limites de signalement
router.post(
    '/:commentId/report',
    authenticateToken,
    checkReportLimits,
    commentController.reportComment
);

// GET /api/comments/user/:userId - Récupérer les commentaires d'un utilisateur spécifique
router.get(
    '/user/:userId',
    commentController.getCommentsByUser
);

// GET /api/comments/my - Récupérer les commentaires de l'utilisateur authentifié
// Requiert l'authentification
router.get(
    '/my',
    authenticateToken,
    commentController.getMyComments
);

// GET /api/comments/search - Rechercher dans les commentaires
router.get(
    '/search',
    commentController.searchComments
);

// GET /api/comments/post/:postId/stats - Statistiques des commentaires d'un post
router.get(
    '/post/:postId/stats',
    commentController.getCommentStats
);

// POST /api/comments/:commentId/pin - Épingler un commentaire (modération)
// Requiert l'authentification et les permissions de modération
router.post(
    '/:commentId/pin',
    authenticateToken,
    checkModerationPermissions,
    commentController.pinComment
);

// POST /api/comments/:commentId/unpin - Désépingler un commentaire (modération)
// Requiert l'authentification et les permissions de modération
router.post(
    '/:commentId/unpin',
    authenticateToken,
    checkModerationPermissions,
    commentController.unpinComment
);

module.exports = router;