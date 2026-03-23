import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../utils/api";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone_number: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = mode === "login"
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, phone_number: form.phone_number, password: form.password, role: "customer" });
      loginUser(res.data.user, res.data.token);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className={`auth-modal ${mode === "register" ? "auth-modal-wide" : ""}`}>

        <button className="auth-close-btn" onClick={onClose}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
            Sign In
          </button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>
            Sign Up
          </button>
          <div className={`auth-tab-indicator ${mode}`} />
        </div>

        <div className="auth-body">
          <div className="auth-header">
            <div className="auth-logo-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span><img src="logo.png" alt="logo" /></span>
            </div>
            <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p>{mode === "login" ? "Sign in to your account" : "Fill in your details to get started"}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            {mode === "register" && (
              <div className="auth-two-col">
                <div className="field">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g Emmanuel Waseth" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="0712 345 678" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} required />
                </div>
              </div>
            )}

            <div className={mode === "register" ? "auth-two-col" : ""}>
              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="customer@gmail.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} required />
              </div>
            </div>

            <div className="auth-submit-row">
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-spinner" />
                ) : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </div>
          </form>

          <div className="auth-switch">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => switchMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}