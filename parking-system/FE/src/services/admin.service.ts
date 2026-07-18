import api from '../utils/api';

export const adminService = {
  getUsers: () => api.get('/users'),

  updateUser: (id: string, body: unknown) => api.put(`/users/${id}`, body),

  deleteUser: (id: string) => api.delete(`/users/${id}`),

  getIncidents: () => api.get('/Incidents'),

  createIncident: (body: unknown) => api.post('/Incidents', body),

  resolveIncident: (id: string) => api.put(`/Incidents/${id}/resolve`),

  deleteIncident: (id: string) => api.delete(`/Incidents/${id}`),

  getBlacklist: () => api.get('/Blacklist'),

  addBlacklist: (body: unknown) => api.post('/Blacklist', body),

  removeBlacklist: (id: string) => api.delete(`/Blacklist/${id}`),

  getNotifications: () => api.get('/Notifications'),

  markNotificationsRead: () => api.post('/Notifications/mark-read'),

  pushNotification: (body: unknown) => api.post('/Notifications/push', body),

  getPricingConfigs: () => api.get('/PricingConfigs'),

  savePricingConfigs: (body: unknown) => api.post('/PricingConfigs', body),

  getRegulations: () => api.get('/Regulations'),

  saveRegulations: (body: unknown) => api.post('/Regulations', body),
};
