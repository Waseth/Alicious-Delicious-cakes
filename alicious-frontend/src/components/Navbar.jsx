import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ onLoginClick, onCartClick }) {
  const { user, logoutUser } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const links = [
    { label: "Home", to: "/" },
    { label: "Cakes", to: "/cakes" },
    { label: "Contact", to: "/contact" },
  ];
  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-img">
            <span className="nav-logo-img-placeholder">🎂</span>
          </div>
          <span className="nav-logo-text">Alicious Delicious</span>
        </Link>
        <div className="nav-right">
          {links.map((l) => (
            <div key={l.to} className="nav-link-wrap">
              <Link to={l.to} className={`nav-link ${location.pathname === l.to ? "active" : ""}`}>{l.label}</Link>
              {location.pathname === l.to && <span className="nav-dot" />}
            </div>
          ))}
          <div className="nav-sep" />
          <button className="nav-cart" onClick={onCartClick} title="Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {count > 0 && <span className="nav-cart-badge">{count}</span>}
          </button>
          {user ? (
            <div className="nav-user-group">
              <Link to="/profile" className="nav-avatar" title={user.name}>{user.name.charAt(0).toUpperCase()}</Link>
              <button className="nav-btn-ghost" onClick={() => { logoutUser(); navigate("/"); }}>Sign out</button>
            </div>
          ) : (
            <button className="nav-btn-pink" onClick={onLoginClick}>Sign in</button>
          )}
        </div>
      </nav>
      <nav className="mobile-bar">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={`mobile-bar-item ${location.pathname === l.to ? "active" : ""}`}>
            {l.to === "/" && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            {l.to === "/cakes" && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><path d="M12 10a2 2 0 0 1 2 2"/><circle cx="12" cy="12" r="1"/></svg>}
            {l.to === "/contact" && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            <span>{l.label}</span>
          </Link>
        ))}
        <button className="mobile-bar-item" onClick={onCartClick}>
          <span className="mobile-cart-wrap">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {count > 0 && <span className="mobile-cart-badge">{count}</span>}
          </span>
          <span>Cart</span>
        </button>
        {user ? (
          <Link to="/profile" className={`mobile-bar-item ${location.pathname === "/profile" ? "active" : ""}`}>
            <span className="mobile-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span>Me</span>
          </Link>
        ) : (
          <button className="mobile-bar-item" onClick={onLoginClick}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Login</span>
          </button>
        )}
      </nav>
    </>
  );
}