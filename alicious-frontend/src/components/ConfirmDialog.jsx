import { useEffect } from "react";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dialog-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={danger ? "btn-pink" : "btn-pink"}
            style={danger ? { background: "#ef4444", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" } : {}}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}