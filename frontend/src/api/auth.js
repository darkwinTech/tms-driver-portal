import apiClient from './axiosClient.js';

export function login(email, password) {
  return apiClient.post('/auth/login', { email, password });
}

export function register(payload) {
  return apiClient.post('/auth/register', payload);
}

export function fetchMe() {
  return apiClient.get('/auth/me');
}

// JWT is stateless - no server-side session to invalidate. AuthContext
// already clears localStorage itself on logout; kept as a no-op export so
// that call site doesn't need to change.
export function logoutSession() {}
