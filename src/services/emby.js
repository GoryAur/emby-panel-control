import api from './api';

export const embyService = {
  async getUsers() {
    return api.get('/api/emby/users');
  },

  async getSubscriptions() {
    return api.get('/api/emby/subscriptions');
  },

  async createUser(data) {
    return api.post('/api/emby/create-user', data);
  },

  async editUser(data) {
    return api.post('/api/emby/edit-user', data);
  },

  async deleteUser(userId, serverId) {
    return api.post('/api/emby/delete-user', { userId, serverId });
  },

  async toggleUser(userId, serverId, enable) {
    return api.post('/api/emby/toggle-user', { userId, serverId, enable });
  },

  async extendSubscription(userId, serverId, months) {
    return api.post('/api/emby/extend-subscription', { userId, serverId, months });
  },

  async stopPlayback(sessionId, serverId) {
    return api.post('/api/emby/stop-playback', { sessionId, serverId });
  },

  async checkExpired(dryRun = true) {
    return api.post('/api/emby/check-expired', { dryRun });
  },
};
