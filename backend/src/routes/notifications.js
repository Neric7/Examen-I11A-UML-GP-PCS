// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// GET /api/notifications/unread-count - Obtenir le nombre de notifications non lues (MUST be before /:id routes)
router.get('/unread-count', notificationController.getUnreadCount);

// GET /api/notifications - Récupérer les notifications
router.get('/', notificationController.getNotifications);

// PUT /api/notifications/mark-all-read - Marquer toutes les notifications comme lues (MUST be before /:id routes)
router.put('/mark-all-read', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', notificationController.deleteNotification);

console.log('📍 Module notifications.js chargé avec succès!');

module.exports = router;