import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../utils/api";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login");
  const [animating, setAnimating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone_number: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const switchMode = (next) => {
    if (next === mode || animating) return;
    setAnimating(true);
    setError("");
    setTimeout(() => { setMode(next); setAnimating(false); }, 420);
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = mode === "login"
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, phone_number: form.phone_number, password: form.password, role: "customer" });
      loginUser(res.data.user, res.data.token);
      onClose();
    } catch (err) { setError(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const isRegister = mode === "register";

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`auth-split-card ${isRegister ? "is-register" : ""} ${animating ? "animating" : ""}`}>

        <button className="auth-x-btn" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="auth-pink-half">
          <div className="auth-pink-inner">
            <div className="auth-pink-logo">🎂</div>
            <h3 className="auth-pink-title">
              {isRegister ? "Already a member?" : "New here?"}
            </h3>
            <p className="auth-pink-sub">
              {isRegister
                ? "Sign in and continue where you left off."
                : "Create an account and start ordering beautiful custom cakes."}
            </p>
            <button className="auth-pink-switch-btn" onClick={() => switchMode(isRegister ? "login" : "register")}>
              {isRegister ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>

        <div className="auth-form-half">
          <div className="auth-form-inner">
            <h2 className="auth-form-title">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="auth-form-sub">
              {isRegister ? "Fill in your details below" : "Sign in to your account"}
            </p>

            {error && (
              <div className="form-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-fields">
              {isRegister && (
                <>
                  <div className="field">
                    <label>Full Name</label>
                    <input type="text" placeholder="Alice Odhiambo" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="0712 345 678" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} required />
                  </div>
                </>
              )}
              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} required />
              </div>
              <button type="submit" className="btn-pink full" disabled={loading}>
                {loading
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                      Please wait…
                    </span>
                  : isRegister ? "Create Account" : "Sign In"}
              </button>
            </form>

            <p className="auth-bottom-hint">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => switchMode(isRegister ? "login" : "register")}>
                {isRegister ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}