import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, cancelOrder } from "../utils/api";
import ConfirmDialog from "../components/ConfirmDialog";

const S = { order_received:{label:"Received",color:"#d97706",bg:"#fffbeb"}, baking_in_progress:{label:"Baking",color:"#2563eb",bg:"#eff6ff"}, cake_ready:{label:"Ready",color:"#059669",bg:"#f0fdf4"}, delivered:{label:"Delivered",color:"#6b7280",bg:"#f9fafb"}, cancelled:{label:"Cancelled",color:"#dc2626",bg:"#fff5f5"} };

export default function ProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [tab, setTab] = useState("orders");
  const [confirmCancel, setConfirmCancel] = useState(null); const [cancelling, setCancelling] = useState(null);
  useEffect(() => { getMyOrders().then((r) => setOrders(r.data?.orders || [])).catch(() => setOrders([])).finally(() => setLoading(false)); }, []);
  const handleCancel = async () => {
    setCancelling(confirmCancel); setConfirmCancel(null);
    try { await cancelOrder(confirmCancel, { reason:"Cancelled by customer" }); setOrders(p=>p.map(o=>o.id===confirmCancel?{...o,status:"cancelled"}:o)); }
    catch (err) { alert(err.message); } finally { setCancelling(null); }
  };
  if (!user) return <div className="profile-page"><p>Please log in.</p></div>;
  const filtered = tab==="orders" ? orders.filter(o=>!["delivered","cancelled"].includes(o.status)) : tab==="history" ? orders.filter(o=>["delivered","cancelled"].includes(o.status)) : [];
  return (
    <div className="profile-page">
      {confirmCancel && <ConfirmDialog title="Cancel Order" message="Are you sure you want to cancel this order?" onConfirm={handleCancel} onCancel={() => setConfirmCancel(null)} confirmLabel="Cancel Order" danger />}
      <div className="profile-head">
        <div className="profile-av">{user.name.charAt(0).toUpperCase()}</div>
        <div><h1>{user.name}</h1><p>{user.email}</p><p>{user.phone_number}</p></div>
      </div>
      <div className="profile-tabs">
        {["orders","history","settings"].map(t=><button key={t} className={`p-tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>{t==="orders"?"My Orders":t==="history"?"History":"Settings"}</button>)}
      </div>
      {tab !== "settings" && (
        <div className="orders-list">
          {loading ? <div className="dots-loader"><span/><span/><span/></div> : filtered.length===0 ? <div className="a-empty"><p>No orders here yet</p></div> : filtered.map(order => {
            const s = S[order.status] || S.order_received;
            return (
              <div key={order.id} className="order-card">
                <div className="order-card-top">
                  <div><span className="order-id-txt">Order #{order.id}</span><span className="order-date-txt">· {new Date(order.created_at).toLocaleDateString()}</span></div>
                  <span className="order-status-txt" style={{color:s.color,background:s.bg}}>{s.label}</span>
                </div>
                <div className="order-body">
                  <div className="order-items-rows">{order.items?.map(i=><div key={i.id} className="order-item-line"><span>{i.cake_name} ×{i.quantity}</span><span>KES {(i.price_at_time*i.quantity).toLocaleString()}</span></div>)}</div>
                  <div className="order-fin-grid">
                    <div className="fin-item"><div className="fin-item-label">Total</div><div className="fin-item-val">KES {parseFloat(order.total_price).toLocaleString()}</div></div>
                    <div className="fin-item"><div className="fin-item-label">Deposit</div><div className="fin-item-val" style={{color:order.deposit_paid?"#059669":"#dc2626"}}>{order.deposit_paid?"✓ Paid":"⏳ Pending"}</div></div>
                  </div>
                  {order.status==="order_received" && !order.deposit_paid && <button className="cancel-btn" onClick={() => setConfirmCancel(order.id)} disabled={cancelling===order.id}>{cancelling===order.id?"Cancelling…":"Cancel Order"}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {tab==="settings" && (
        <div className="settings-block">
          {[["Name",user.name],["Email",user.email],["Phone",user.phone_number],["Account",user.role]].map(([l,v])=><div key={l} className="settings-row"><label>{l}</label><span>{v}</span></div>)}
        </div>
      )}
    </div>
  );
}