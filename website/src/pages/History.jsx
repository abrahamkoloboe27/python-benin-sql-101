import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import * as historyApi from '../api/history';

export default function History() {
  const { user, backendOnline } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await historyApi.getHistory(100);
      setHistory(data.history);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleCopy = async (query, id) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await historyApi.deleteEntry(id);
      setHistory((h) => h.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Effacer tout l\'historique ? Cette action est irréversible.')) return;
    try {
      await historyApi.clearHistory();
      setHistory([]);
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    // Backend known to be offline: show informative message
    if (backendOnline === false) {
      return (
        <div className="page history-page">
          <div className="backend-offline-info">
            <span className="backend-offline-info-icon">🔌</span>
            <h2>Backend non disponible</h2>
            <p>Le serveur backend est inaccessible.</p>
            <p>
              Le <strong>playground SQL</strong> fonctionne sans connexion —
              rendez-vous sur les{' '}
              <Link to="/exercises">exercices</Link> pour pratiquer.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="page history-page">
        <div className="auth-required">
          <span className="auth-required-icon">🔐</span>
          <h2>Connexion requise</h2>
          <p>Connectez-vous pour accéder à votre historique de requêtes SQL.</p>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className="page history-page">
      <div className="page-header">
        <h1>📜 Historique des requêtes</h1>
        <p>
          Requêtes exécutées par <strong>{user.username}</strong>.
          Elles sont sauvegardées automatiquement à chaque exécution.
        </p>
      </div>

      {error && (
        <div className="db-error" style={{ marginBottom: '1rem' }}>
          ❌ {error}
          <button
            style={{ marginLeft: '1rem', fontSize: '.8rem', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline' }}
            onClick={fetchHistory}
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-hint">⏳ Chargement de l'historique…</div>
      ) : history.length === 0 ? (
        <div className="history-empty">
          <span className="history-empty-icon">📭</span>
          <p>
            Aucune requête dans l'historique. Exécutez des requêtes dans les{' '}
            <Link to="/exercises">exercices</Link> pour les voir ici.
          </p>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <span className="history-count">
              {history.length} requête{history.length > 1 ? 's' : ''}
            </span>
            <button className="btn-danger" onClick={handleClearAll}>
              🗑️ Tout effacer
            </button>
          </div>

          <div className="history-list">
            {history.map((h) => (
              <div
                key={h.id}
                className={`history-item ${h.has_error ? 'has-error' : ''}`}
              >
                <div className="history-meta">
                  <span className="history-time">
                    {new Date(h.executed_at + 'Z').toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                  <span className={`history-badge ${h.has_error ? 'error' : 'success'}`}>
                    {h.has_error
                      ? '❌ Erreur'
                      : `✅ ${h.rows_returned} ligne${h.rows_returned !== 1 ? 's' : ''}`}
                  </span>
                  <div className="history-item-actions">
                    <button
                      className="btn-icon"
                      title="Copier la requête"
                      onClick={() => handleCopy(h.query, h.id)}
                    >
                      {copied === h.id ? '✅' : '📋'}
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      title="Supprimer cette entrée"
                      onClick={() => handleDeleteEntry(h.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <pre className="history-query">{h.query}</pre>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

