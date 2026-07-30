import apiClient from './axiosClient.js';

export function getMonthlyReport() {
  return apiClient.get('/reports/monthly');
}

export function getCompletedReport() {
  return apiClient.get('/reports/completed');
}

export function getRejectedReport() {
  return apiClient.get('/reports/rejected');
}

export function exportReportsExcel() {
  return apiClient.get('/reports/export', { responseType: 'blob' });
}
