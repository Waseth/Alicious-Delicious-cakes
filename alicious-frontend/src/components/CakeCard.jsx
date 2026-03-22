import { useCart } from "../context/CartContext";

export default function CakeCard({ cake }) {
  const { addToCart, cart } = useCart();
  const inCart = cart.find((i) => i.id === cake.id);
  const catBg = { birthday:"#fff0f4", wedding:"#fff0f4", graduation:"#fff0f4", casual:"#fff0f4" };
  return (
    <div className="cake-card">
      <div className="cake-card-img" style={{ background: catBg[cake.category] || "#fff0f4" }}>
        {cake.image_url
          ? <img src={cake.image_url} alt={cake.name} />
          : <div className="cake-placeholder-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fad0db" strokeWidth="1.5"><path d="M18 14v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4"/><path d="M12 2v4"/><path d="M2 14h20"/><path d="M6 14V9a6 6 0 0 1 12 0v5"/><path d="M9 2h6"/></svg>
            </div>}
        {cake.featured && <span className="cake-chip">Featured</span>}
      </div>
      <div className="cake-card-body">
        <div className="cake-tags"><span className="tag">{cake.category}</span><span className="tag">{cake.flavor}</span></div>
        <h3 className="cake-name">{cake.name}</h3>
        {cake.description && <p className="cake-desc">{cake.description}</p>}
        <div className="cake-footer">
          <span className="cake-price">KES {parseFloat(cake.base_price).toLocaleString()}</span>
          <button className={`btn-sm ${inCart ? "btn-sm-green" : "btn-sm-pink"}`} onClick={() => addToCart(cake)}>
            {inCart
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}