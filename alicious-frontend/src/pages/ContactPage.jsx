import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createReview } from "../utils/api";

export default function ContactPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { setError("Please log in to leave a review."); return; }
    setLoading(true); setError("");
    try { await createReview({ rating, review_text: reviewText }); setSubmitted(true); }
    catch (err) { setError(err.message || "Failed to submit."); }
    finally { setLoading(false); }
  };

  const contacts = [
    { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.32C1.6 2.19 2.47 1.1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16v.92z"/></svg>, label:"Call Us", sub:"+254 723 619 572", href:"tel:+254723619572" },
    { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label:"WhatsApp", sub:"Chat with us", href:"https://wa.me/254723619572" },
    { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label:"Email", sub:"wasethalice@gmail.com", href:"mailto:wasethalice@gmail.com" },
    { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>, label:"SMS", sub:"Send a text", href:"sms:+254723619572" },
  ];

  return (
    <div className="contact-page">
      <div className="contact-hero"><h1>Get in Touch</h1><p>We'd love to hear from you</p></div>

      <div className="contact-grid">
        <div>
          <h2>Contact Us</h2>
          <div className="contact-cards">
            {contacts.map((c) => (
              <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="contact-card">
                <div className="contact-card-icon">{c.icon}</div>
                <div><h3>{c.label}</h3><p>{c.sub}</p></div>
              </a>
            ))}
          </div>
        </div>

        <div id="review">
          <h2>Leave a Review</h2>
          {submitted ? (
            <div className="review-success"><div className="ri">🌟</div><h3>Thank you!</h3><p>Your review has been submitted.</p></div>
          ) : (
            <form className="review-form" onSubmit={handleReview}>
              <div className="field">
                <label>Rating</label>
                <div className="star-row">{[1,2,3,4,5].map(s => <button key={s} type="button" className={`star-btn ${s <= rating ? "filled" : ""}`} onClick={() => setRating(s)}>★</button>)}</div>
              </div>
              <div className="field">
                <label>Your Review</label>
                <textarea placeholder="Tell us about your experience…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} required />
              </div>
              {error && <div className="form-error">{error}</div>}
              {!user && <p className="login-prompt">Please <strong>log in</strong> to leave a review.</p>}
              <div style={{ display:"flex", justifyContent:"center" }}>
                <button type="submit" className="btn-pink" style={{ minWidth:160 }} disabled={loading || !user}>
                  {loading ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><span>🎂</span><span>Alicious Delicious Cakes</span></div>
          <p className="footer-credit">© {new Date().getFullYear()} Alicious Delicious Cakes. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/cakes">Cakes</Link>
            <Link to="/contact">Contact</Link>
            <a href="https://wa.me/254723619572" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}