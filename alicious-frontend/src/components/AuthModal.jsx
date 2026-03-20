import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../utils/api";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", phone_number: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let res;
      if (mode === "login") {
        res = await login({ email: form.email, password: form.password });
      } else {
        res = await register({
          name: form.name,
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
          role: form.role,
        });
      }
      loginUser(res.data.user, res.data.token);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
            Login
          </button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>
            Sign Up
          </button>
        </div>

        <div className="auth-modal-body">
          <h2 className="auth-title">
            {mode === "login" ? "Welcome Back 🎂" : "Join Us 🎀"}
          </h2>
          <p className="auth-subtitle">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="0712345678" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} required />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
