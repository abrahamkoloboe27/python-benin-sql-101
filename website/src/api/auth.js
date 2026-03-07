import { apiFetch } from './client';

export const register = (username, password) =>
  apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const login = (username, password) =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const getMe = () => apiFetch('/api/auth/me');
