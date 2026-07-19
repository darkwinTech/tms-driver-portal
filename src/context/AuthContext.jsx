import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginApi, fetchMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('tms_token');
        localStorage.removeItem('tms_user');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await loginApi(email, password);
    localStorage.setItem('tms_token', res.data.token);
    localStorage.setItem('tms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    setUser(null);
  }

  const isProcessor = user?.role === 'Processor' || user?.role === 'Admin';
  const isOperations = user?.role === 'Operations';
  const isAdTeam = user?.role === 'AD Team';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isProcessor, isOperations, isAdTeam }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}