import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const authData = res.data.data || res.data;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    setUser(authData);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    const authData = res.data.data || res.data;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    setUser(authData);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);



