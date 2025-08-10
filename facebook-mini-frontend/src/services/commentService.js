import api from './api';

const commentService = {
  // Créer un nouveau commentaire
  async createComment(postId, content) {
    try {
      const response = await api.post('/comments', {
        post_id: postId,
        content
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création du commentaire' };
    }
  },

  // Récupérer les commentaires d'un post
  async getCommentsByPost(postId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/comments/post/${postId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des commentaires' };
    }
  },

  // Récupérer un commentaire spécifique
  async getComment(commentId) {
    try {
      const response = await api.get(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du commentaire' };
    }
  },

  // Modifier un commentaire
  async updateComment(commentId, content) {
    try {
      const response = await api.put(`/comments/${commentId}`, {
        content
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la modification du commentaire' };
    }
  },

  // Supprimer un commentaire
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la suppression du commentaire' };
    }
  }
};

export default commentService;