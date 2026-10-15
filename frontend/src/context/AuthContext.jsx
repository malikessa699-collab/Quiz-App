import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // On mount, restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem('quizcraft_token');
    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }
    api
      .get('/api/auth/me')
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('quizcraft_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, []);

  const setSession = (token, userData) => {
    localStorage.setItem('quizcraft_token', token);
    setUser(userData);
  };

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setSession(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.post('/api/auth/register', payload);
    setSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('quizcraft_token');
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}