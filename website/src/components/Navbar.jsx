import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar({ onLoginClick }) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        🎓 Python Bénin – SQL 101
      </NavLink>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          Accueil
        </NavLink>
        <NavLink to="/schema" className={({ isActive }) => isActive ? 'active' : ''}>
          Base de données
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => isActive ? 'active' : ''}>
          Exercices
        </NavLink>

        {user ? (
          <>
            <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
              📜 Historique
            </NavLink>
            <div className="navbar-user">
              <span className="navbar-username">👤 {user.username}</span>
              <button className="btn-logout" onClick={logout} title="Se déconnecter">
                Déconnexion
              </button>
            </div>
          </>
        ) : (
          <button className="btn-login" onClick={onLoginClick}>
            🔐 Connexion
          </button>
        )}
      </div>
    </nav>
  );
}
