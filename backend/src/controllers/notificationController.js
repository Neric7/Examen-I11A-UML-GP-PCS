// src/controllers/notificationController.js
const db = require('../config/database');

// Helper function pour générer les messages de notification
const generateNotificationMessage = (notification) => {
  const actorName = notification.actor_firstName && notification.actor_lastName 
    ? `${notification.actor_firstName} ${notification.actor_lastName}`
    : notification.actor_username || 'Un utilisateur';

  switch (notification.type) {
    case 'like':
      return `${actorName} a aimé votre publication`;
    case 'comment':
      return `${actorName} a commenté votre publication`;
    case 'reply':
      return `${actorName} a répondu à votre commentaire`;
    case 'friend_request':
      return `${actorName} vous a envoyé une demande d'ami`;
    case 'friend_accepted':
      return `${actorName} a accepté votre demande d'ami`;
    case 'mention':
      return `${actorName} vous a mentionné dans une publication`;
    case 'birthday':
      return `C'est l'anniversaire de ${actorName} aujourd'hui !`;
    default:
      return notification.message || 'Nouvelle notification';
  }
};

const notificationController = {
  // Récupérer toutes les notifications d'un utilisateur
  async getNotifications(req, res) {
    try {
      // 🔍 Debug: Vérifier l'utilisateur authentifié
      console.log('🔍 req.user:', req.user);
      console.log('🔍 req.headers.authorization:', req.headers.authorization);
      
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          debug: {
            hasUser: !!req.user,
            userId: req.user?.id,
            authHeader: !!req.headers.authorization
          }
        });
      }
      
      const userId = req.user.id;
      const { limit = 20, offset = 0, filter = 'all' } = req.query;
      
      console.log('🔍 UserId:', userId, 'Filter:', filter);

      let whereClause = 'WHERE n.user_id = ?';
      let queryParams = [userId];

      // Filtrer selon le type
      if (filter !== 'all') {
        switch (filter) {
          case 'unread':
            whereClause += ' AND n.is_read = FALSE';
            break;
          case 'friends':
            whereClause += " AND n.type IN ('friend_request', 'friend_accepted')";
            break;
          case 'likes':
            whereClause += " AND n.type = 'like'";
            break;
          case 'comments':
            whereClause += " AND n.type IN ('comment', 'reply')";
            break;
          case 'mentions':
            whereClause += " AND n.type = 'mention'";
            break;
        }
      }

      // Convert limit and offset to integers
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);

      const query = `
        SELECT 
          n.*,
          u.username as actor_username,
          u.firstName as actor_firstName,
          u.lastName as actor_lastName,
          u.profile_picture as actor_profile_picture,
          CASE 
            WHEN n.related_item_type = 'post' THEN p.content
            WHEN n.related_item_type = 'comment' THEN c.content
            ELSE NULL
          END as related_content,
          CASE 
            WHEN n.related_item_type = 'post' THEN p.image_url
            ELSE NULL
          END as related_image,
          -- Debug fields to see what's happening with JOINs
          p.id as post_id_debug,
          c.id as comment_id_debug
        FROM notifications n
        LEFT JOIN users u ON n.related_user_id = u.id
        LEFT JOIN posts p ON n.related_item_type = 'post' AND CAST(n.related_item_id AS UNSIGNED) = p.id
        LEFT JOIN comments c ON n.related_item_type = 'comment' AND CAST(n.related_item_id AS UNSIGNED) = c.id
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;

      // Add limit and offset to query parameters
      queryParams.push(limitInt, offsetInt);

      console.log('🔍 Query SQL:', query);
      console.log('🔍 Query params:', queryParams);

      const [notifications] = await db.execute(query, queryParams);

      // Transformer les données pour le frontend
      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        // Générer un message dynamique
        message: generateNotificationMessage(notification),
        // Ajouter l'objet actor pour le frontend
        actor: {
          id: notification.related_user_id,
          username: notification.actor_username,
          firstName: notification.actor_firstName,
          lastName: notification.actor_lastName,
          profile_picture: notification.actor_profile_picture
        },
        // Ajouter l'objet post si c'est lié à un post
        post: notification.related_item_type === 'post' ? {
          id: notification.related_item_id,
          content: notification.related_content,
          image: notification.related_image
        } : null,
        // Ajouter l'objet comment si c'est lié à un commentaire
        comment: notification.related_item_type === 'comment' ? {
          id: notification.related_item_id,
          content: notification.related_content
        } : null
      }));

      // Compter le total des notifications non lues
      const [unreadCount] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.json({
        success: true,
        data: transformedNotifications,
        unreadCount: unreadCount[0].count,
        pagination: {
          limit: limitInt,
          offset: offsetInt,
          total: transformedNotifications.length
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: error.message
      });
    }
  },

  // Marquer une notification comme lue
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const [result] = await db.execute(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Notification marquée comme lue'
      });

    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage de la notification',
        error: error.message
      });
    }
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const [result] = await db.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.json({
        success: true,
        message: `${result.affectedRows} notifications marquées comme lues`
      });

    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des notifications',
        error: error.message
      });
    }
  },

  // Supprimer une notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const [result] = await db.execute(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Notification supprimée'
      });

    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la notification',
        error: error.message
      });
    }
  },

  // Créer une nouvelle notification (utilisé en interne)
  async createNotification(userId, type, relatedUserId, relatedItemType = null, relatedItemId = null, message) {
    try {
      const [result] = await db.execute(
        `INSERT INTO notifications 
         (user_id, type, related_user_id, related_item_type, related_item_id, message) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, type, relatedUserId, relatedItemType, relatedItemId, message]
      );

      return result.insertId;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Obtenir le nombre de notifications non lues
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const [result] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.json({
        success: true,
        unreadCount: result[0].count
      });

    } catch (error) {
      console.error('Erreur lors du comptage des notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des notifications',
        error: error.message
      });
    }
  }
};

module.exports = notificationController;