import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ onLoginClick, onCartClick }) {
  const { user, logoutUser } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const navLinks = isAdmin
    ? []
    : [
        { label: "Home", to: "/" },
        { label: "Cakes", to: "/cakes" },
        { label: "Contact", to: "/contact" },
      ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">🎂</span>
            <span className="logo-text">Alicious Delicious</span>
          </Link>
          {user && <span className="nav-welcome">Welcome, {user.name.split(" ")[0]}</span>}
        </div>

        <div className="navbar-right">
          {!isAdmin && navLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}

          {!isAdmin && (
            <button className="nav-cart-btn" onClick={onCartClick}>
              🛒 Cart {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          )}

          {user ? (
            <>
              {!isAdmin && (
                <Link to="/profile" className="nav-avatar" title={user.name}>
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              )}
              <button className="nav-btn logout-btn" onClick={() => { logoutUser(); navigate("/"); }}>
                Logout
              </button>
            </>
          ) : (
            <button className="nav-btn login-btn" onClick={onLoginClick}>Login / Sign Up</button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      {!isAdmin && (
        <nav className="bottom-nav">
          <Link to="/" className={`bottom-nav-item ${location.pathname === "/" ? "active" : ""}`}>
            <span>🏠</span><span>Home</span>
          </Link>
          <Link to="/cakes" className={`bottom-nav-item ${location.pathname === "/cakes" ? "active" : ""}`}>
            <span>🎂</span><span>Cakes</span>
          </Link>
          <button className="bottom-nav-item" onClick={onCartClick}>
            <span>🛒{count > 0 && <sup>{count}</sup>}</span><span>Cart</span>
          </button>
          <Link to="/contact" className={`bottom-nav-item ${location.pathname === "/contact" ? "active" : ""}`}>
            <span>💬</span><span>Contact</span>
          </Link>
          {user ? (
            <Link to="/profile" className={`bottom-nav-item ${location.pathname === "/profile" ? "active" : ""}`}>
              <span className="bottom-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span>Me</span>
            </Link>
          ) : (
            <button className="bottom-nav-item" onClick={onLoginClick}>
              <span>👤</span><span>Login</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
}
