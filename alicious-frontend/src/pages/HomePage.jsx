import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFeaturedCakes, getLatestReviews } from "../utils/api";
import CakeCard from "../components/CakeCard";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [sliderIdx, setSliderIdx] = useState(0);

  useEffect(() => {
    getFeaturedCakes().then((r) => setFeatured(r.data || [])).catch(() => {});
    getLatestReviews().then((r) => setReviews(r.data || [])).catch(() => {});
  }, []);

  const visibleCakes = featured.slice(sliderIdx, sliderIdx + 3);
  const canPrev = sliderIdx > 0;
  const canNext = sliderIdx + 3 < featured.length;

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-line slant">Alicious</span>
              <span className="hero-line slant-2">Delicious</span>
              <span className="hero-line slant-3">Cakes</span>
            </h1>
            <p className="hero-subtitle">Handcrafted with love for every celebration — birthdays, weddings, and everything sweet in between.</p>
            <Link to="/cakes" className="hero-btn">Order Now 🎂</Link>
          </div>
          <div className="hero-photo-wrap">
            <div className="hero-photo-ring">
              <div className="hero-photo-inner">
                <span className="hero-photo-placeholder">👩‍🍳</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
            <path d="M0,40 C300,80 900,0 1200,40 L1200,80 L0,80 Z" fill="#fff1f5" />
          </svg>
        </div>
      </section>

      {/* How to Order */}
      <section className="how-to-order">
        <h2 className="section-title">How to Order</h2>
        <p className="section-subtitle">Simple, sweet, and stress-free</p>
        <div className="steps">
          {[
            { icon: "🎂", step: "1. Choose Your Cake", desc: "Browse our catalog and pick your dream cake." },
            { icon: "💳", step: "2. Pay Deposit", desc: "Pay 50% deposit via M-Pesa to confirm your order." },
            { icon: "📱", step: "3. We Bake", desc: "We craft your cake with love and notify you when ready." },
            { icon: "✅", step: "4. Full Payment", desc: "Pay the remaining 50% when your cake is ready for collection." },
          ].map((s) => (
            <div key={s.step} className="step-card">
              <div className="step-icon">{s.icon}</div>
              <h3>{s.step}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cakes */}
      <section className="featured-cakes">
        <h2 className="section-title">Featured Cakes</h2>
        <p className="section-subtitle">Our most loved creations</p>
        {featured.length === 0 ? (
          <div className="empty-state">
            <span>🎂</span>
            <p>Our featured cakes are coming soon!</p>
            <Link to="/cakes" className="pink-btn">Browse All Cakes</Link>
          </div>
        ) : (
          <div className="featured-slider">
            <button className="slider-btn prev" onClick={() => setSliderIdx(sliderIdx - 1)} disabled={!canPrev}>‹</button>
            <div className="slider-track">
              {visibleCakes.map((cake) => (
                <CakeCard key={cake.id} cake={cake} />
              ))}
            </div>
            <button className="slider-btn next" onClick={() => setSliderIdx(sliderIdx + 1)} disabled={!canNext}>›</button>
          </div>
        )}
        <div className="featured-dots">
          {Array.from({ length: Math.max(1, featured.length - 2) }).map((_, i) => (
            <button key={i} className={`dot ${sliderIdx === i ? "active" : ""}`} onClick={() => setSliderIdx(i)} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link to="/cakes" className="pink-btn outline">View All Cakes →</Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2 className="section-title">What Customers Say</h2>
        <p className="section-subtitle">Real reviews from real cake lovers</p>
        {reviews.length === 0 ? (
          <p className="empty-reviews">No reviews yet — be the first!</p>
        ) : (
          <div className="reviews-grid">
            {reviews.map((r) => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">{r.user_name?.charAt(0) || "?"}</div>
                  <div>
                    <div className="review-name">{r.user_name || "Anonymous"}</div>
                    <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  </div>
                </div>
                <p className="review-text">{r.review_text || "Amazing cakes!"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-icon">🎂</span>
            <span>Alicious Delicious Cakes</span>
          </div>
          <p className="footer-credit">Created with ❤️ by Emmanuel Waseth</p>
          <div className="footer-links">
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://wa.me/254798863379" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
