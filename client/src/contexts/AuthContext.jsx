import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token && !socket) {
      const s = io(API, { auth: { token } });
      s.on('connect_error', (err) => console.error('socket error', err));
      setSocket(s);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [token]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (socket) { socket.disconnect(); setSocket(null); }
  };

  const axiosInstance = axios.create({
    baseURL: API + '/api',
  });
  axiosInstance.interceptors.request.use(cfg => {
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });

  return (
    <AuthContext.Provider value={{ user, token, socket, login, logout, axios: axiosInstance }}>
      {children}
    </AuthContext.Provider>
  );
};
