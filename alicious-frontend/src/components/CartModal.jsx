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
  const [step, setStep] = useState("cart");
  const [error, setError] = useState("");
  const minDate = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
  const handleCheckout = async () => {
    if (!user) { onClose(); onLoginNeeded(); return; }
    if (!deliveryDate) { setError("Please select a delivery date."); return; }
    if (!phone) { setError("Please enter your M-Pesa phone number."); return; }
    setError(""); setLoading(true);
    try {
      const orderRes = await createOrder({ items: cart.map((i) => ({ cake_id: i.id, quantity: i.quantity })), delivery_date: new Date(deliveryDate).toISOString(), custom_message: customMessage });
      await payDeposit({ order_id: orderRes.data.id, phone_number: phone });
      clearCart(); setStep("success");
    } catch (err) { setError(err.message || "Payment failed. Please try again."); }
    finally { setLoading(false); }
  };
  if (step === "success") return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cart-card success-state">
        <div className="success-icon-wrap">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2>Order Placed!</h2>
        <p>An M-Pesa prompt has been sent to <strong>{phone}</strong>. Enter your PIN to complete the transaction</p>
        <p className="success-note">You'll receive an SMS confirmation once payment is confirmed.</p>
        <button className="btn-pink full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cart-card">
        <div className="cart-header">
          <h2>Your Cart {cart.length > 0 && <span className="cart-count">{cart.length}</span>}</h2>
          <button className="icon-btn" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        {cart.length === 0 ? (
          <div className="empty-cart-state" style={{textAlign:"center"}}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <p>Your cart is empty</p>
            <button className="btn-pink" onClick={onClose}>Browse Cakes</button>
          </div>
        ) : (
          <div className="cart-body">
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-row">
                  <div className="cart-row-img">{item.image_url ? <img src={item.image_url} alt={item.name} /> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d42f5a" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}</div>
                  <div className="cart-row-info"><div className="cart-row-name">{item.name}</div><div className="cart-row-price">KES {item.base_price.toLocaleString()}</div></div>
                  <div className="qty-ctrl">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-row-total">KES {(item.base_price * item.quantity).toLocaleString()}</div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-form">
              <div className="field"><label>Delivery Date</label><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={minDate} /></div>
              <div className="field"><label>Special Instructions <span className="optional">(optional)</span></label><textarea placeholder="e.g. Happy 21st Birthday! Blue and gold theme…" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={3} /></div>
              <div className="field"><label>M-Pesa Phone Number</label><input type="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            {error && <div className="form-error" style={{ margin: "0 1.5rem" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>{error}</div>}
            <div className="cart-summary-box">
              <div className="summary-line"><span>Subtotal</span><span>KES {total.toLocaleString()}</span></div>
              <div className="summary-line deposit-line"><span>Deposit Due Now <small>(50%)</small></span><span className="deposit-val">KES {deposit.toLocaleString()}</span></div>
              <p className="summary-note">Remaining KES {(total - deposit).toLocaleString()} paid when your cake is ready</p>
            </div>
            <button className="btn-pink full" onClick={handleCheckout} disabled={loading}>
              {loading ? "Processing…" : `Pay Deposit — KES ${deposit.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}