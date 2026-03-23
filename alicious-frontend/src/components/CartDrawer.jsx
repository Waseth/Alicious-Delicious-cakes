import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, payDeposit } from "../utils/api";
import "./CartDrawer.css";

export default function CartDrawer() {
  const { items, removeItem, updateQty, clearCart, total, deposit, open, setOpen } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState("cart"); // cart | delivery | payment
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCheckout = async () => {
    if (!user) { setError("Please login to place an order."); return; }
    setLoading(true); setError("");
    try {
      const orderData = await createOrder({
        items: items.map((i) => ({ cake_id: i.id, quantity: i.quantity })),
        delivery_date: deliveryDate || undefined,
        custom_message: customMessage,
      });
      const order = orderData.data;
      // Trigger STK push
      await payDeposit({ order_id: order.id, phone_number: phone });
      setSuccess(`M-Pesa prompt sent to ${phone}. Enter your PIN to pay Ksh${deposit.toLocaleString()} deposit.`);
      setStep("cart");
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={() => setOpen(false)} />
      <div className="cart-drawer">
        <div className="drawer-header">
          <h3>🛒 Your Cart {items.length > 0 && `(${items.length})`}</h3>
          <button className="modal-close" onClick={() => setOpen(false)}>×</button>
        </div>

        {success && (
          <div className="cart-success">
            <p>{success}</p>
            <button className="btn btn-outline btn-sm" onClick={() => setSuccess("")}>Close</button>
          </div>
        )}

        {!success && (
          <>
            {items.length === 0 ? (
              <div className="cart-empty">
                <span>🎂</span>
                <p>Your cart is empty</p>
                <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Browse Cakes</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {items.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-img">
                        {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>🎂</span>}
                      </div>
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">KES {(item.base_price * item.quantity).toLocaleString()}</p>
                        <div className="qty-ctrl">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="remove-btn" onClick={() => removeItem(item.id)}>×</button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
                  <div className="summary-row deposit"><span>Deposit (50%)</span><span>KES {deposit.toLocaleString()}</span></div>
                  <div className="summary-row"><span>Balance on delivery</span><span>KES {(total - deposit).toLocaleString()}</span></div>
                </div>

                {step === "cart" && (
                  <div className="cart-actions">
                    {error && <p className="form-error">{error}</p>}
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => setStep("delivery")}>
                      Proceed to Checkout
                    </button>
                  </div>
                )}

                {step === "delivery" && (
                  <div className="checkout-form">
                    <h4>Delivery Details</h4>
                    <div className="form-group">
                      <label className="form-label">M-Pesa Phone Number</label>
                      <input className="form-input" placeholder="0712345678" value={phone}
                        onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Delivery Date (optional)</label>
                      <input className="form-input" type="date" value={deliveryDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDeliveryDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Special Instructions (optional)</label>
                      <textarea className="form-input" rows={3} placeholder="e.g. Happy Birthday Sarah, vanilla frosting..."
                        value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} />
                    </div>
                    {error && <p className="form-error">{error}</p>}
                    <div className="checkout-btns">
                      <button className="btn btn-outline" onClick={() => setStep("cart")}>Back</button>
                      <button className="btn btn-primary" onClick={handleCheckout} disabled={loading || !phone}>
                        {loading ? "Processing..." : `Pay Deposit KES ${deposit.toLocaleString()}`}
                      </button>
                    </div>
                    <p className="payment-note">
                      📱 You will receive an M-Pesa STK push. Enter your PIN to confirm.
                      You will NOT enter your PIN on this website.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
