import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import * as historyApi from '../api/history';

const AuthContext = createContext(null);

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
    <AuthContext.Provider value={{ user, login, register, logout, saveQuery }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
