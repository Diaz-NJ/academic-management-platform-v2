import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      authAPI.validateSession()
        .then(() => {
          const userData = JSON.parse(localStorage.getItem('user'));
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('sessionId');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { sessionId, user: userData } = response.data;
    
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return response;
  };

  const register = async (userData) => {
    return await authAPI.register(userData);
  };

  const logout = async () => {
    await authAPI.logout();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};