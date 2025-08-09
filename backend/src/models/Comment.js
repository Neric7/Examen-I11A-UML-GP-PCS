const db = require('../config/database');

class Comment {
  // Créer un nouveau commentaire
  static async create(commentData) {
    try {
      console.log('Données reçues pour création:', commentData);
      
      // Destructurer et valider les données
      const { content, postId, authorId, parentCommentId } = commentData;
      
      // Validation des champs obligatoires
      if (!content || content.trim() === '') {
        throw new Error('Le contenu du commentaire est obligatoire');
      }
      
      if (!postId || !authorId) {
        throw new Error('postId et authorId sont obligatoires');
      }
      
      // Nettoyer et préparer les données
      const cleanData = {
        content: content.trim(),
        postId: parseInt(postId),
        authorId: parseInt(authorId),
        parentCommentId: parentCommentId ? parseInt(parentCommentId) : null
      };
      
      console.log('Données nettoyées:', cleanData);
      
      // Vérifier que le post existe
      const [postExists] = await db.execute(
        'SELECT id FROM posts WHERE id = ? AND is_active = TRUE',
        [cleanData.postId]
      );
      
      if (postExists.length === 0) {
        throw new Error('Le post spécifié n\'existe pas');
      }
      
      // Si c'est une réponse, vérifier que le commentaire parent existe
      if (cleanData.parentCommentId) {
        const [parentExists] = await db.execute(
          'SELECT id FROM comments WHERE id = ? AND post_id = ? AND is_active = TRUE',
          [cleanData.parentCommentId, cleanData.postId]
        );
        
        if (parentExists.length === 0) {
          throw new Error('Le commentaire parent n\'existe pas');
        }
      }
      
      // Insérer le commentaire
      const query = `
        INSERT INTO comments (content, author_id, post_id, parent_comment_id, comment_date, created_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      
      const params = [
        cleanData.content,
        cleanData.authorId,
        cleanData.postId,
        cleanData.parentCommentId
      ];
      
      console.log('Requête SQL:', query);
      console.log('Paramètres:', params);
      
      const [result] = await db.execute(query, params);
      
      // Récupérer le commentaire créé avec les informations de l'auteur
      const [newComment] = await db.execute(`
        SELECT 
          c.*,
          u.username,
          u.profile_picture,
          (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_active = TRUE) as replies_count
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.id = ?
      `, [result.insertId]);
      
      return newComment[0];
      
    } catch (error) {
      console.error('Erreur dans Comment.create:', error);
      throw error;
    }
  }
  
  // Récupérer les commentaires d'un post avec pagination
  static async getByPost(postId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT 
          c.*,
          u.username,
          u.profile_picture,
          (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_active = TRUE) as replies_count
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ? AND c.parent_comment_id IS NULL AND c.is_active = TRUE
        ORDER BY c.is_pinned DESC, c.comment_date DESC
        LIMIT ? OFFSET ?
      `;
      
      const [comments] = await db.execute(query, [parseInt(postId), limit, offset]);
      
      // Compter le total
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND parent_comment_id IS NULL AND is_active = TRUE',
        [parseInt(postId)]
      );
      
      return {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult[0].total / limit),
          totalComments: countResult[0].total,
          hasMore: countResult[0].total > page * limit
        }
      };
      
    } catch (error) {
      console.error('Erreur dans Comment.getByPost:', error);
      throw error;
    }
  }
  
  // Récupérer les réponses d'un commentaire
  static async getReplies(commentId, page = 1, limit = 5) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT 
          c.*,
          u.username,
          u.profile_picture,
          (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.parent_comment_id = ? AND c.is_active = TRUE
        ORDER BY c.comment_date ASC
        LIMIT ? OFFSET ?
      `;
      
      const [replies] = await db.execute(query, [parseInt(commentId), limit, offset]);
      
      // Compter le total
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM comments WHERE parent_comment_id = ? AND is_active = TRUE',
        [parseInt(commentId)]
      );
      
      return {
        replies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult[0].total / limit),
          totalReplies: countResult[0].total,
          hasMore: countResult[0].total > page * limit
        }
      };
      
    } catch (error) {
      console.error('Erreur dans Comment.getReplies:', error);
      throw error;
    }
  }
  
  // Récupérer un commentaire par ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          u.username,
          u.profile_picture,
          (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_active = TRUE) as replies_count
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.id = ? AND c.is_active = TRUE
      `;
      
      const [comments] = await db.execute(query, [parseInt(id)]);
      return comments[0] || null;
      
    } catch (error) {
      console.error('Erreur dans Comment.getById:', error);
      throw error;
    }
  }
  
  // Mettre à jour un commentaire
  static async update(id, content) {
    try {
      if (!content || content.trim() === '') {
        throw new Error('Le contenu du commentaire ne peut pas être vide');
      }
      
      const query = `
        UPDATE comments 
        SET content = ?, is_edited = TRUE, updated_at = NOW()
        WHERE id = ? AND is_active = TRUE
      `;
      
      const [result] = await db.execute(query, [content.trim(), parseInt(id)]);
      
      if (result.affectedRows === 0) {
        throw new Error('Commentaire non trouvé ou déjà supprimé');
      }
      
      return await this.getById(id);
      
    } catch (error) {
      console.error('Erreur dans Comment.update:', error);
      throw error;
    }
  }
  
  // Supprimer un commentaire (soft delete)
  static async delete(id) {
    try {
      const query = `
        UPDATE comments 
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = ?
      `;
      
      const [result] = await db.execute(query, [parseInt(id)]);
      
      if (result.affectedRows === 0) {
        throw new Error('Commentaire non trouvé');
      }
      
      return true;
      
    } catch (error) {
      console.error('Erreur dans Comment.delete:', error);
      throw error;
    }
  }
  
  // Liker un commentaire
  static async like(commentId, userId) {
    try {
      // Vérifier si le like existe déjà
      const [existingLike] = await db.execute(
        'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [parseInt(commentId), parseInt(userId)]
      );
      
      if (existingLike.length > 0) {
        throw new Error('Vous avez déjà liké ce commentaire');
      }
      
      // Ajouter le like
      await db.execute(
        'INSERT INTO comment_likes (comment_id, user_id, like_date) VALUES (?, ?, NOW())',
        [parseInt(commentId), parseInt(userId)]
      );
      
      return true;
      
    } catch (error) {
      console.error('Erreur dans Comment.like:', error);
      throw error;
    }
  }
  
  // Retirer le like d'un commentaire
  static async unlike(commentId, userId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [parseInt(commentId), parseInt(userId)]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Like non trouvé');
      }
      
      return true;
      
    } catch (error) {
      console.error('Erreur dans Comment.unlike:', error);
      throw error;
    }
  }
}

module.exports = Comment;