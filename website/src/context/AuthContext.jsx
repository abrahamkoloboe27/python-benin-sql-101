import { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './authContext';
import * as authApi from '../api/auth';
import * as historyApi from '../api/history';

function loadSession() {
  try {
    const s = localStorage.getItem('sql101_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);
  const [backendOnline, setBackendOnline] = useState(null); // null = inconnu

  /** Vérifie si le backend est joignable (silencieux, sans bloquer le rendu). */
  useEffect(() => {
    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(4000) })
      .then((r) => setBackendOnline(r.ok))
      .catch(() => setBackendOnline(false));
  }, []);

  /** Persist session to localStorage and React state */
  const setSession = useCallback((userData, token) => {
    localStorage.setItem('sql101_token', token);
    localStorage.setItem('sql101_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setSession(data.user, data.token);
    return data.user;
  }, [setSession]);

  const register = useCallback(async (username, password) => {
    const data = await authApi.register(username, password);
    setSession(data.user, data.token);
    return data.user;
  }, [setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('sql101_token');
    localStorage.removeItem('sql101_user');
    setUser(null);
  }, []);

  /**
   * Save a SQL query to the user's history.
   * Silently ignored when not logged in or when the backend is unavailable.
   */
  const saveQuery = useCallback(async (query, rowsReturned, hasError) => {
    if (!user || !query?.trim()) return;
    try {
      await historyApi.saveQuery(query.trim(), rowsReturned ?? 0, hasError ? 1 : 0);
    } catch {
      // Don't disrupt the UX if the backend is temporarily unavailable
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, saveQuery, backendOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

