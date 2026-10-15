import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const close = () => setOpen(false);

  const studentLinks = (
    <>
      <NavLink to="/dashboard" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={close}>
        Dashboard
      </NavLink>
      <NavLink to="/generate" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={close}>
        New Quiz
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={close}>
        History
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={close}>
        Analytics
      </NavLink>
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={close}>
          Admin
        </NavLink>
      )}
    </>
  );

  const authLinks = (
    <>
      <NavLink to="/profile" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={close}>
        {user?.name?.split(' ')[0] || 'Profile'}
      </NavLink>
      <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
        Logout
      </button>
    </>
  );

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to={user ? '/dashboard' : '/'} className="navbar__brand" onClick={close}>
          <span className="navbar__logo">Q</span>
          QuizCraft
        </Link>

        <button className="navbar__toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>

        <nav className={`navbar__links${open ? ' navbar__links--open' : ''}`}>
          {user ? (
            <>
              {studentLinks}
              {authLinks}
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link" onClick={close}>Login</Link>
              <Link to="/register" className="navbar__link" onClick={close}>Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;