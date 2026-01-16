import api from './api';

export const authService = {
  // Auth
  async login(username, password) {
    return api.post('/api/auth/login', { username, password });
  },

  async logout() {
    return api.post('/api/auth/logout');
  },

  async getCurrentUser() {
    return api.get('/api/auth/me');
  },

  // Resellers (Panel Users)
  async getResellers() {
    return api.get('/api/panel/users');
  },

  async createReseller(data) {
    return api.post('/api/panel/create-reseller', data);
  },

  async updateReseller(data) {
    return api.post('/api/panel/edit-reseller', data);
  },

  async deleteReseller(userId) {
    return api.post('/api/panel/delete-reseller', { userId });
  },
};
