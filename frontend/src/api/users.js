import apiClient from './axiosClient.js';

export function listUsers(role) {
  return apiClient.get('/users', { params: role ? { role } : {} });
}
