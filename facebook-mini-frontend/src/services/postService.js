import api from './api';

export const postService = {
  async getAllPosts() {
    const response = await api.get('/posts');
    return response.data;
  },

  async getPostById(id) {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  async createPost(postData) {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  async updatePost(id, postData) {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  }
};