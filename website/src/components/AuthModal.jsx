import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const usernameRef = useRef(null);

  // Focus username field on open
  useEffect(() => { usernameRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const switchTab = (t) => { setTab(t); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'register') {
      if (password !== confirm) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'login' ? 'Connexion' : 'Inscription'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>

        <div className="modal-header">
          <span className="modal-emoji">{tab === 'login' ? '🔐' : '📝'}</span>
          <h2 className="modal-title">
            {tab === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'login'}
            className={`modal-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Se connecter
          </button>
          <button
            role="tab"
            aria-selected={tab === 'register'}
            className={`modal-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="auth-username">Nom d'utilisateur</label>
            <input
              id="auth-username"
              ref={usernameRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex : jean_sql"
              autoComplete="username"
              minLength={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Mot de passe</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </div>

          {tab === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-confirm">Confirmer le mot de passe</label>
              <input
                id="auth-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && (
            <div className="form-error" role="alert">
              ❌ {error}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? '⏳ Chargement…'
              : tab === 'login'
              ? '🔐 Se connecter'
              : '✅ Créer mon compte'}
          </button>
        </form>

        <p className="auth-note">
          ℹ️ Vos données (compte + historique) sont stockées sur le serveur backend.
          Assurez-vous que le backend est démarré et configuré.
        </p>
      </div>
    </div>
  );
}
