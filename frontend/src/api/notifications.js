import apiClient from './axiosClient.js';

export function listNotifications() {
  return apiClient.get('/notifications');
}

export function markAllNotificationsRead() {
  return apiClient.patch('/notifications/read-all');
}
