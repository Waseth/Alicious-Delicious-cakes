import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, payDeposit } from "../utils/api";

export default function CartModal({ onClose, onLoginNeeded }) {
  const { cart, removeFromCart, updateQuantity, total, deposit, clearCart } = useCart();
  const { user } = useAuth();
  const [deliveryDate, setDeliveryDate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("cart"); // cart | confirm | success
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!user) { onClose(); onLoginNeeded(); return; }
    if (!deliveryDate) { setError("Please select a delivery date."); return; }
    if (!phone) { setError("Please enter your M-Pesa phone number."); return; }
    setError("");
    setLoading(true);
    try {
      const orderRes = await createOrder({
        items: cart.map((i) => ({ cake_id: i.id, quantity: i.quantity })),
        delivery_date: new Date(deliveryDate).toISOString(),
        custom_message: customMessage,
      });
      const newOrderId = orderRes.data.id;
      setOrderId(newOrderId);

      await payDeposit({ order_id: newOrderId, phone_number: phone });
      clearCart();
      setStep("success");
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="cart-modal success-modal">
          <div className="success-icon">🎉</div>
          <h2>Order Placed!</h2>
          <p>An M-Pesa prompt has been sent to <strong>{phone}</strong>.</p>
          <p>Please enter your PIN to pay the deposit of <strong>KES {deposit.toLocaleString()}</strong>.</p>
          <p className="success-note">You'll receive an SMS confirmation once payment is confirmed. We'll notify you when your cake is ready!</p>
          <button className="pink-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cart-modal">
        <div className="cart-modal-header">
          <h2>🛒 Your Cart</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <span>🎂</span>
            <p>Your cart is empty</p>
            <button className="pink-btn" onClick={onClose}>Browse Cakes</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>🎂</span>}
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p>KES {item.base_price.toLocaleString()} each</p>
                  </div>
                  <div className="cart-item-qty">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-item-total">
                    KES {(item.base_price * item.quantity).toLocaleString()}
                  </div>
                  <button className="cart-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))}
            </div>

            <div className="cart-details">
              <div className="form-group">
                <label>Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]} />
              </div>
              <div className="form-group">
                <label>Special Instructions (optional)</label>
                <textarea placeholder="E.g. Happy 21st Birthday Sarah! Blue and gold theme..."
                  value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={3} />
              </div>
              <div className="form-group">
                <label>M-Pesa Phone Number</label>
                <input type="tel" placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="cart-summary">
              <div className="summary-row">
                <span>Total Price</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="summary-row deposit-row">
                <span>Deposit Due Now (50%)</span>
                <span className="deposit-amount">KES {deposit.toLocaleString()}</span>
              </div>
              <div className="summary-note">
                💡 The remaining KES {(total - deposit).toLocaleString()} is paid when your cake is ready.
              </div>
            </div>

            <button className="pink-btn full-width" onClick={handleCheckout} disabled={loading}>
              {loading ? "Processing..." : `Pay Deposit — KES ${deposit.toLocaleString()}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
