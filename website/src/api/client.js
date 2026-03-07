/**
 * Wrapper fetch centralisé.
 * – Lit le JWT dans localStorage et l'injecte dans Authorization.
 * – Lance une Error avec le message renvoyé par l'API si status >= 400.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('sql101_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez que le backend est démarré.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`);
  return data;
}
