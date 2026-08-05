import apiClient from './axiosClient.js';

// ---------------------------------------------------------------------------
export function getStats() {
  return apiClient.get('/requests/stats');
}

// ---------------------------------------------------------------------------
export function listRequests(params = {}) {
  return apiClient.get('/requests', { params });
}

// ---------------------------------------------------------------------------
export function getRequest(id) {
  return apiClient.get(`/requests/${id}`);
}

// ---------------------------------------------------------------------------
export function createRequest(payload) {
  return apiClient.post('/requests', payload);
}

// ---------------------------------------------------------------------------
export function updateStatus(id, targetStatus, remarks) {
  return apiClient.patch(`/requests/${id}/status`, { status: targetStatus, remarks });
}

// ---------------------------------------------------------------------------
export function assignRequest(id, assigneeId) {
  return apiClient.patch(`/requests/${id}/assign`, { assigneeId });
}

// ---------------------------------------------------------------------------
export function updateDriverProfile(requestId, driverId, fields = {}) {
  return apiClient.patch(`/requests/${requestId}/drivers/${driverId}/profile`, fields);
}

// ---------------------------------------------------------------------------
export function completeDriverProfiles(requestId) {
  return apiClient.post(`/requests/${requestId}/complete-driver-profiles`);
}

// ---------------------------------------------------------------------------
export function markComplete(id) {
  return apiClient.post(`/requests/${id}/mark-complete`);
}

// ---------------------------------------------------------------------------
export function resubmitRequest(id, payload) {
  return apiClient.put(`/requests/${id}/resubmit`, payload);
}

// ---------------------------------------------------------------------------
export function uploadAttachment(id, file, meta = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (meta.driverIndex !== undefined && meta.driverIndex !== null) {
    formData.append('driverIndex', meta.driverIndex);
  }
  if (meta.docType) formData.append('docType', meta.docType);
  // Don't set Content-Type manually - the browser needs to generate the
  // multipart boundary itself, or multer fails to parse the body.
  return apiClient.post(`/requests/${id}/attachments`, formData);
}

// Both endpoints require Authorization, so a plain window.open/<a href>
// navigation can't carry the token - fetch the bytes via axios (which the
// request interceptor stamps with the token) and turn them into a blob URL.
export async function previewAttachment(requestId, attachmentId) {
  // Open the tab synchronously while the click's user activation is still
  // valid (popup blockers reject window.open after an await), then point it
  // at the blob once it's ready.
  const win = window.open('', '_blank');
  const res = await apiClient.get(`/requests/${requestId}/attachments/${attachmentId}`, {
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(res.data);
  if (win) {
    win.location = objectUrl;
  } else {
    window.open(objectUrl, '_blank');
  }
  // Give the new tab time to load the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function downloadAttachment(requestId, attachmentId, fileName) {
  const res = await apiClient.get(`/requests/${requestId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// ---------------------------------------------------------------------------
export async function downloadSecurityReportPdf(id, fileName) {
  const res = await apiClient.get(`/requests/${id}/security-report`, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || 'security-report.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// ---------------------------------------------------------------------------
export function downloadExcelTemplate() {
  return apiClient.get('/requests/excel-template', { responseType: 'blob' });
}

export function parseExcelUpload(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/requests/excel-upload', formData);
}

export function exportRequestDrivers(id) {
  return apiClient.get(`/requests/${id}/drivers/export`, { responseType: 'blob' });
}
