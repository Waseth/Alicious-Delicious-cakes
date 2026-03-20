import { useCart } from "../context/CartContext";

export default function CakeCard({ cake }) {
  const { addToCart, cart } = useCart();
  const inCart = cart.find((i) => i.id === cake.id);

  const categoryEmoji = {
    birthday: "🎂", wedding: "💍", graduation: "🎓", casual: "☕"
  };

  const flavorColor = {
    classic: "#f9c2d0", chocolate: "#8B4513", fruity: "#ff7f50", specialty: "#dda0dd"
  };

  return (
    <div className="cake-card">
      <div className="cake-card-img">
        {cake.image_url ? (
          <img src={cake.image_url} alt={cake.name} />
        ) : (
          <div className="cake-placeholder">
            <span>{categoryEmoji[cake.category] || "🎂"}</span>
          </div>
        )}
        {cake.featured && <span className="cake-badge">⭐ Featured</span>}
        <div className="cake-flavor-dot" style={{ background: flavorColor[cake.flavor] || "#f9c2d0" }} title={cake.flavor} />
      </div>
      <div className="cake-card-body">
        <h3>{cake.name}</h3>
        <p className="cake-desc">{cake.description || `A beautiful ${cake.category} cake`}</p>
        <div className="cake-tags">
          <span className="cake-tag">{cake.category}</span>
          <span className="cake-tag">{cake.flavor}</span>
        </div>
        <div className="cake-card-footer">
          <span className="cake-price">KES {parseFloat(cake.base_price).toLocaleString()}</span>
          <button
            className={`add-to-cart-btn ${inCart ? "in-cart" : ""}`}
            onClick={() => addToCart(cake)}
          >
            {inCart ? `✓ In Cart (${inCart.quantity})` : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
