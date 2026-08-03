import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-stone-100'
    }`;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white/90 px-3 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3 sm:gap-6">
        <span className="text-base font-bold text-stone-900 sm:text-lg">📚 openshelf</span>
        <div className="flex gap-1">
          <NavLink to="/" className={linkClass} end>
            Browse
          </NavLink>
          <NavLink to="/shelves" className={linkClass}>
            My shelves
          </NavLink>
          <NavLink to="/feed" className={linkClass}>
            Feed
          </NavLink>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <NavLink to={`/profile/${user?.id}`} className="text-sm text-stone-600 hover:underline">
          {user?.name}
        </NavLink>
        <button className="btn-secondary px-3 py-1.5 text-xs sm:text-sm" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
