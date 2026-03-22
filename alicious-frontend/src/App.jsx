import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import CartModal from "./components/CartModal";
import HomePage from "./pages/HomePage";
import CakesPage from "./pages/CakesPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPanel from "./pages/AdminPanel";

function AppInner() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "admin") {
      const path = window.location.pathname;
      if (path !== "/admin") navigate("/admin", { replace: true });
    }
  }, [user]);

  if (loading) return (
    <div className="splash">
      <div className="splash-inner">
        <span className="splash-emoji">🎂</span>
        <p className="splash-title">Alicious Delicious</p>
        <div className="splash-bar"><div className="splash-fill" /></div>
      </div>
    </div>
  );

  const isAdmin = user?.role === "admin";

  return (
    <div className="app">
      {!isAdmin && (
        <Navbar onLoginClick={() => setShowAuth(true)} onCartClick={() => setShowCart(true)} />
      )}
      <main className={isAdmin ? "admin-main-wrap" : "page-wrap"}>
        <Routes>
          <Route path="/" element={<HomePage onOrderClick={() => {}} />} />
          <Route path="/cakes" element={<CakesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
          <Route path="/admin" element={user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showCart && <CartModal onClose={() => setShowCart(false)} onLoginNeeded={() => setShowAuth(true)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppInner />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}