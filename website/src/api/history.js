import { apiFetch } from './client';

export const getHistory = (limit = 50) =>
  apiFetch(`/api/history?limit=${limit}`);

export const saveQuery = (query, rows_returned, has_error) =>
  apiFetch('/api/history', {
    method: 'POST',
    body: JSON.stringify({ query, rows_returned, has_error }),
  });

export const clearHistory = () =>
  apiFetch('/api/history', { method: 'DELETE' });

export const deleteEntry = (id) =>
  apiFetch(`/api/history/${id}`, { method: 'DELETE' });
