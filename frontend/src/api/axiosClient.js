import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
});

// Endpoints that must NOT carry a (possibly stale) Bearer token - no token
// exists yet when these are called.
const AUTH_FREE_PATHS = ['/auth/login', '/auth/register'];

apiClient.interceptors.request.use((config) => {
  const isAuthFree = AUTH_FREE_PATHS.some((p) => config.url?.startsWith(p));
  if (!isAuthFree) {
    const token = localStorage.getItem('tms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onLoginPage = window.location.pathname === '/login';
      const wasLoginCall = error.config?.url?.startsWith('/auth/login');
      // A 401 on the login call itself just means "wrong credentials" - it
      // must surface as an inline form error, not trigger a session-expired
      // redirect. Also don't loop if we're already on /login.
      if (!wasLoginCall && !onLoginPage) {
        localStorage.removeItem('tms_token');
        localStorage.removeItem('tms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
