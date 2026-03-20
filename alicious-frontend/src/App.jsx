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


  useEffect(() => {
    if (user?.role === "admin" && window.location.pathname !== "/admin") {
      window.location.href = "/admin";
    }
  }, [user]);

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">🎂</div>
        <div className="splash-text">Alicious Delicious Cakes</div>
        <div className="splash-loader" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="app">
      {!isAdmin && (
        <Navbar
          onLoginClick={() => setShowAuth(true)}
          onCartClick={() => setShowCart(true)}
        />
      )}

      <main className={`main-content ${isAdmin ? "admin-mode" : ""}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cakes" element={<CakesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
          <Route path="/admin" element={
            user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
      {showCart && (
        <CartModal
          onClose={() => setShowCart(false)}
          onLoginNeeded={() => setShowAuth(true)}
        />
      )}
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
