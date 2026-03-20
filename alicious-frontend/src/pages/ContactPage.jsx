import { useState } from "react";
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
    setLoading(true);
    setError("");
    try {
      await createReview({ rating, review_text: reviewText });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Get in Touch 💬</h1>
        <p>We'd love to hear from you — reach out any way you prefer</p>
      </div>

      <div className="contact-grid">
        <div className="contact-methods">
          <h2>Contact Us</h2>
          <div className="contact-cards">
            <a href="https://wa.me/254723619572" target="_blank" rel="noreferrer" className="contact-card whatsapp">
              <span className="contact-icon">📱</span>
              <div>
                <h3>WhatsApp</h3>
                <p>Chat with us directly</p>
              </div>
            </a>
            <a href="sms:+254723619572" className="contact-card sms">
              <span className="contact-icon">💬</span>
              <div>
                <h3>SMS</h3>
                <p>Send us a text</p>
              </div>
            </a>
            <a href="tel:+254723619572" className="contact-card phone">
              <span className="contact-icon">📞</span>
              <div>
                <h3>Call</h3>
                <p>Speak to us directly</p>
              </div>
            </a>
            <a href="mailto:wasethalice@gmail.com" className="contact-card email">
              <span className="contact-icon">✉️</span>
              <div>
                <h3>Email</h3>
                <p>wasethalice@gmail.com</p>
              </div>
            </a>
          </div>
        </div>

        <div className="review-section">
          <h2>Leave a Review</h2>
          {submitted ? (
            <div className="review-success">
              <span>🌟</span>
              <h3>Thank you for your review!</h3>
              <p>Your feedback means the world to us.</p>
            </div>
          ) : (
            <form className="review-form" onSubmit={handleReview}>
              <div className="star-rating">
                <label>Your Rating</label>
                <div className="stars">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} type="button" className={`star ${s <= rating ? "filled" : ""}`} onClick={() => setRating(s)}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  placeholder="Tell us about your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              {!user && (
                <p className="login-prompt">Please <strong>log in</strong> to leave a review.</p>
              )}
              <button type="submit" className="pink-btn" disabled={loading || !user}>
                {loading ? "Submitting..." : "Submit Review ⭐"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
