import api from './api';

export const serverService = {
  async getServers() {
    return api.get('/api/servers');
  },

  async addServer(data) {
    return api.post('/api/servers', data);
  },

  async updateServer(data) {
    return api.put('/api/servers', data);
  },

  async deleteServer(serverId) {
    // Note: The API uses DELETE method but with query param or body? 
    // Looking at ServerManagement.js: fetch(`/api/servers?serverId=${serverId}`, { method: 'DELETE' })
    // So it uses query params.
    return api.request(`/api/servers?serverId=${serverId}`, { method: 'DELETE' });
  },

  async toggleServer(serverId, enabled) {
    // Looking at ServerManagement.js: fetch('/api/servers', { method: 'PUT', body: { serverId, enabled } })
    return api.put('/api/servers', { serverId, enabled });
  }
};
