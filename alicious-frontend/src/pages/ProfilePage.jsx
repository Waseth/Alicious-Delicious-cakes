import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, cancelOrder } from "../utils/api";

const STATUS_LABELS = {
  order_received: { label: "Order Received", color: "#f59e0b", icon: "📋" },
  baking_in_progress: { label: "Baking", color: "#3b82f6", icon: "👩‍🍳" },
  cake_ready: { label: "Ready!", color: "#10b981", icon: "🎂" },
  delivered: { label: "Delivered", color: "#6b7280", icon: "✅" },
  cancelled: { label: "Cancelled", color: "#ef4444", icon: "❌" },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then((r) => setOrders(r.data?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId, { reason: "Cancelled by customer" });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
    } catch (err) {
      alert(err.message || "Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  };

  if (!user) return <div className="profile-page"><p>Please log in.</p></div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <p>{user.phone_number}</p>
        </div>
      </div>

      <div className="profile-tabs">
        {["orders", "history", "settings"].map((t) => (
          <button key={t} className={`profile-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "orders" ? "My Orders" : t === "history" ? "Order History" : "Settings"}
          </button>
        ))}
      </div>

      {(tab === "orders" || tab === "history") && (
        <div className="orders-list">
          {loading ? (
            <div className="loading-state">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <span>🎂</span>
              <p>No orders yet!</p>
            </div>
          ) : (
            orders
              .filter((o) => tab === "history" ? o.status === "delivered" || o.status === "cancelled" : o.status !== "delivered" && o.status !== "cancelled")
              .map((order) => {
                const s = STATUS_LABELS[order.status] || STATUS_LABELS.order_received;
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <span className="order-id">Order #{order.id}</span>
                        <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="order-status" style={{ color: s.color }}>
                        {s.icon} {s.label}
                      </span>
                    </div>

                    <div className="order-items">
                      {order.items?.map((item) => (
                        <div key={item.id} className="order-item">
                          <span>{item.cake_name} × {item.quantity}</span>
                          <span>KES {(item.price_at_time * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-financials">
                      <div className="fin-row">
                        <span>Total</span>
                        <span>KES {parseFloat(order.total_price).toLocaleString()}</span>
                      </div>
                      <div className="fin-row">
                        <span>Deposit</span>
                        <span style={{ color: order.deposit_paid ? "#10b981" : "#ef4444" }}>
                          {order.deposit_paid ? "✓ Paid" : "⏳ Pending"} — KES {parseFloat(order.deposit_required).toLocaleString()}
                        </span>
                      </div>
                      {order.deposit_paid && !order.balance_paid && (
                        <div className="fin-row">
                          <span>Balance Due</span>
                          <span style={{ color: "#f59e0b" }}>KES {parseFloat(order.balance_due || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {order.delivery_date && (
                      <p className="order-delivery">📅 Delivery: {new Date(order.delivery_date).toLocaleDateString()}</p>
                    )}

                    {order.status === "order_received" && !order.deposit_paid && (
                      <button className="cancel-btn" onClick={() => handleCancel(order.id)} disabled={cancelling === order.id}>
                        {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="settings-panel">
          <h2>Account Details</h2>
          <div className="settings-info">
            <div className="setting-row"><label>Name</label><span>{user.name}</span></div>
            <div className="setting-row"><label>Email</label><span>{user.email}</span></div>
            <div className="setting-row"><label>Phone</label><span>{user.phone_number}</span></div>
            <div className="setting-row"><label>Account Type</label><span>{user.role}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
