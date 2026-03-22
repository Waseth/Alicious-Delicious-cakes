import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getFeaturedCakes, getLatestReviews } from "../utils/api";
import CakeCard from "../components/CakeCard";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const reviewsRef = useRef(null);

  useEffect(() => {
    getFeaturedCakes().then((r) => setFeatured(r.data || [])).catch(() => {}).finally(() => setLoadingFeatured(false));
    getLatestReviews().then((r) => setReviews(r.data || [])).catch(() => {}).finally(() => setLoadingReviews(false));
  }, []);

  const perPage = 3;
  const visible = featured.slice(idx, idx + perPage);

  return (
    <div className="home">

      <section className="hero">
        <div className="hero-bg-area" />
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-pill">Handcrafted with love</div>
            <h1 className="hero-title">
              <span>Alicious</span>
              <span className="hero-title-accent">Delicious</span>
              <span>Cakes</span>
            </h1>
            <p className="hero-body">Custom cakes baked fresh for every celebration — birthdays, weddings, graduations and beyond.</p>
            <div className="hero-ctas">
              <Link to="/cakes" className="btn-pink">Order Now</Link>
              <Link to="/contact" className="btn-outline">Get in Touch</Link>
            </div>
          </div>

          <div className="hero-photo-area">
            <div className="hero-photo-ring">
              <div className="hero-photo-inner">
                <img src="/mom.jpeg" alt="Alice Odhiambo" />
              </div>
              <div className="hero-photo-overflow">
                <img src="/mom.jpeg" alt="" aria-hidden="true" />
              </div>
            </div>
            <div className="hero-photo-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>5.0 Rating</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section how-section">
        <div className="section-inner">
          <div className="section-label">Simple Process</div>
          <h2 className="section-title">How to Order</h2>
          <div className="steps-grid">
            {[
              { n:"01", icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title:"Choose a Cake", desc:"Browse our catalog and pick your dream cake." },
              { n:"02", icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title:"Pay 50% Deposit", desc:"Secure your order with a quick M-Pesa payment." },
              { n:"03", icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, title:"We Bake It", desc:"We craft your cake and notify you when ready." },
              { n:"04", icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>, title:"Pay Balance & Collect", desc:"Pay the remaining 50% and collect your cake." },
            ].map((s, i) => (
              <div key={s.n} style={{ display:"contents" }}>
                <div className="step-card" style={{ animationDelay:`${i * 0.1}s` }}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon-wrap">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < 3 && (
                  <div className="step-arrow">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="section-inner">
          <div className="section-label">Our Specials</div>
          <div className="section-head-row">
            <h2 className="section-title">Featured Cakes</h2>
            <Link to="/cakes" className="btn-browse-all">Browse All</Link>
          </div>
          {loadingFeatured ? (
            <div className="cakes-grid">{[1,2,3].map(i => <div key={i} className="cake-skeleton skeleton" style={{ height:300 }} />)}</div>
          ) : featured.length === 0 ? (
            <div className="empty-hero">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <p>Featured cakes coming soon!</p>
              <Link to="/cakes" className="btn-browse-all">Browse All</Link>
            </div>
          ) : (
            <>
              <div className="slider-wrap">
                <button className="slider-arrow" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="slider-track">{visible.map((c) => <CakeCard key={c.id} cake={c} />)}</div>
                <button className="slider-arrow" onClick={() => setIdx(Math.min(featured.length - perPage, idx + 1))} disabled={idx + perPage >= featured.length}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="slider-dots">
                {Array.from({ length: Math.max(1, featured.length - perPage + 1) }).map((_, i) => (
                  <button key={i} className={`dot ${idx === i ? "active" : ""}`} onClick={() => setIdx(i)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section reviews-section" ref={reviewsRef} id="reviews">
        <div className="section-inner">
          <div className="section-label">Happy Customers</div>
          <div className="section-head-row">
            <h2 className="section-title">What They Say</h2>
            <Link to="/contact#review" className="btn-outline-sm">Write a Review →</Link>
          </div>
          {loadingReviews ? (
            <div className="reviews-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:140, borderRadius:8 }} />)}</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews-wrap">
              <p className="no-reviews">No reviews yet.</p>
              <Link to="/contact#review" className="btn-outline-sm">Be the first to review →</Link>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((r, i) => (
                <div key={r.id} className="review-card" style={{ animationDelay:`${i * 0.08}s` }}>
                  <div className="review-top">
                    <div className="review-av">{r.user_name?.charAt(0) || "?"}</div>
                    <div>
                      <div className="review-name">{r.user_name || "Anonymous"}</div>
                      <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                    </div>
                  </div>
                  <p className="review-text">"{r.review_text || "Amazing cakes!"}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><span>🎂</span><span>Alicious Delicious Cakes</span></div>
          <p className="footer-credit">© {new Date().getFullYear()} Alicious Delicious Cakes. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/cakes">Cakes</Link>
            <Link to="/contact">Contact</Link>
            <a href="#reviews">Reviews</a>
            <a href="https://wa.me/254723619572" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}