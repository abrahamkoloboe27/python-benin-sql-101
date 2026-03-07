import { NavLink } from 'react-router-dom';

export default function Navbar() {
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
      </div>
    </nav>
  );
}
