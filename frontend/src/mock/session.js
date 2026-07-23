const TOKEN_KEY = 'tms_token';
const USER_KEY = 'tms_user';

export function setSession(user) {
  localStorage.setItem(TOKEN_KEY, `mock-token-${user.id}`);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSessionUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSession() {
  return !!localStorage.getItem(TOKEN_KEY);
}
