import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getDashboard, getFinance, getAllOrders, getCakes,
  createCake, updateCake, deleteCake, startBaking,
  markReady, markDelivered, getExpenses, createExpense
} from "../utils/api";

const STATUS_LABELS = {
  order_received: { label: "Received", color: "#f59e0b" },
  baking_in_progress: { label: "Baking", color: "#3b82f6" },
  cake_ready: { label: "Ready", color: "#10b981" },
  delivered: { label: "Delivered", color: "#6b7280" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};

// ─── Tiny bar chart ──────────────────────────────────────────────────────────
function BarChart({ data, color, label }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="bar-chart">
      <p className="chart-label">{label}</p>
      <div className="bars">
        {data.map((d) => (
          <div key={d.month} className="bar-col">
            <div className="bar-fill" style={{ height: `${(d.amount / max) * 120}px`, background: color }} title={`KES ${d.amount.toLocaleString()}`} />
            <span className="bar-month">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getDashboard().then((r) => setStats(r.data)).catch(() => {});
    getFinance(year).then((r) => setFinance(r.data)).catch(() => {});
  }, [year]);

  const cards = stats ? [
    { label: "Total Orders", value: stats.total_orders, icon: "📋", color: "#e879a0" },
    { label: "Total Revenue", value: `KES ${parseFloat(stats.total_revenue).toLocaleString()}`, icon: "💰", color: "#10b981" },
    { label: "Total Expenses", value: `KES ${parseFloat(stats.total_expenses).toLocaleString()}`, icon: "📉", color: "#ef4444" },
    { label: "Net Profit", value: `KES ${parseFloat(stats.net_profit).toLocaleString()}`, icon: "📈", color: stats.net_profit >= 0 ? "#10b981" : "#ef4444" },
    { label: "Pending Balances", value: `KES ${parseFloat(stats.pending_balances).toLocaleString()}`, icon: "⏳", color: "#f59e0b" },
  ] : [];

  return (
    <div className="admin-tab-content">
      <h2>Business Overview</h2>
      <div className="stat-cards">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-icon">{c.icon}</span>
            <div>
              <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {finance && (
        <div className="charts-section">
          <div className="chart-header">
            <h3>Monthly Performance ({year})</h3>
            <div className="year-selector">
              <button onClick={() => setYear(year - 1)}>←</button>
              <span>{year}</span>
              <button onClick={() => setYear(year + 1)}>→</button>
            </div>
          </div>
          <div className="charts-row">
            <BarChart data={finance.revenue} color="#e879a0" label="Revenue (KES)" />
            <BarChart data={finance.expenses} color="#ef4444" label="Expenses (KES)" />
            <BarChart data={finance.profit} color="#10b981" label="Profit (KES)" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manage Cakes Tab ─────────────────────────────────────────────────────────
function ManageCakes() {
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", base_price: "", category: "birthday", flavor: "classic", image_url: "", featured: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    getCakes({ per_page: 100 }).then((r) => setCakes(r.data?.items || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", base_price: "", category: "birthday", flavor: "classic", image_url: "", featured: false }); setShowForm(true); setError(""); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || "", base_price: c.base_price, category: c.category, flavor: c.flavor, image_url: c.image_url || "", featured: c.featured }); setShowForm(true); setError(""); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, base_price: parseFloat(form.base_price) };
      if (editing) await updateCake(editing.id, payload);
      else await createCake(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this cake?")) return;
    try { await deleteCake(id); load(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Manage Cakes</h2>
        <button className="pink-btn" onClick={openNew}>+ Add Cake</button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? "Edit Cake" : "New Cake"}</h3>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSave} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Cake Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Price (KES) *</label>
                <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} required min="1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {["birthday", "wedding", "graduation", "casual"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Flavor</label>
                <select value={form.flavor} onChange={(e) => setForm({ ...form, flavor: e.target.value })}>
                  {["classic", "chocolate", "fruity", "specialty"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Featured cake (shown on homepage)
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="outline-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="pink-btn" disabled={saving}>{saving ? "Saving..." : "Save Cake"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading-state">Loading cakes...</div> : (
        <div className="admin-cakes-grid">
          {cakes.map((cake) => (
            <div key={cake.id} className="admin-cake-card">
              <div className="admin-cake-img">
                {cake.image_url ? <img src={cake.image_url} alt={cake.name} /> : <span>🎂</span>}
                {cake.featured && <span className="featured-badge">⭐</span>}
              </div>
              <div className="admin-cake-info">
                <h4>{cake.name}</h4>
                <p>KES {parseFloat(cake.base_price).toLocaleString()} • {cake.category} • {cake.flavor}</p>
              </div>
              <div className="admin-cake-actions">
                <button className="edit-btn" onClick={() => openEdit(cake)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(cake.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manage Orders Tab ────────────────────────────────────────────────────────
function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [acting, setActing] = useState(null);

  const load = () => {
    const params = filter ? { status: filter } : {};
    getAllOrders(params).then((r) => setOrders(r.data?.orders || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const doAction = async (fn, id) => {
    setActing(id);
    try { await fn(id); load(); } catch (err) { alert(err.message); } finally { setActing(null); }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Manage Orders</h2>
        <div className="order-filters">
          {["", "order_received", "baking_in_progress", "cake_ready", "delivered", "cancelled"].map((s) => (
            <button key={s} className={`filter-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
              {s ? STATUS_LABELS[s]?.label : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-state">Loading orders...</div> : orders.length === 0 ? (
        <div className="empty-state"><span>📋</span><p>No orders found</p></div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const s = STATUS_LABELS[order.status] || STATUS_LABELS.order_received;
            return (
              <div key={order.id} className="admin-order-card">
                <div className="admin-order-header">
                  <div>
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-customer"> — {order.user_name || "Customer"}</span>
                    <span className="order-date"> • {new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="order-status-badge" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}` }}>
                    {s.label}
                  </span>
                </div>

                <div className="admin-order-items">
                  {order.items?.map((i) => (
                    <span key={i.id} className="order-item-tag">{i.cake_name} ×{i.quantity}</span>
                  ))}
                </div>

                <div className="admin-order-meta">
                  <span>Total: KES {parseFloat(order.total_price).toLocaleString()}</span>
                  <span style={{ color: order.deposit_paid ? "#10b981" : "#ef4444" }}>
                    Deposit: {order.deposit_paid ? "✓ Paid" : "⏳ Pending"}
                  </span>
                  <span style={{ color: order.balance_paid ? "#10b981" : "#f59e0b" }}>
                    Balance: {order.balance_paid ? "✓ Paid" : "Pending"}
                  </span>
                  {order.delivery_date && <span>📅 {new Date(order.delivery_date).toLocaleDateString()}</span>}
                </div>

                {order.custom_message && (
                  <p className="order-message">💬 "{order.custom_message}"</p>
                )}

                <div className="admin-order-actions">
                  {order.status === "order_received" && order.deposit_paid && (
                    <button className="action-btn bake-btn" onClick={() => doAction(startBaking, order.id)} disabled={acting === order.id}>
                      👩‍🍳 Start Baking
                    </button>
                  )}
                  {order.status === "baking_in_progress" && (
                    <button className="action-btn ready-btn" onClick={() => doAction(markReady, order.id)} disabled={acting === order.id}>
                      🎂 Mark Ready
                    </button>
                  )}
                  {order.status === "cake_ready" && (
                    <button className="action-btn deliver-btn" onClick={() => doAction(markDelivered, order.id)} disabled={acting === order.id}>
                      ✅ Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Track Money Tab ──────────────────────────────────────────────────────────
function TrackMoney() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", type: "general", order_id: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    getExpenses().then((r) => setExpenses(r.data || [])).catch(() => setExpenses([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpense({ ...form, amount: parseFloat(form.amount), order_id: form.order_id || null });
      setShowForm(false);
      setForm({ description: "", amount: "", type: "general", order_id: "" });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Track Money</h2>
        <button className="pink-btn" onClick={() => setShowForm(!showForm)}>+ Add Expense</button>
      </div>

      <div className="expense-summary">
        <div className="stat-card">
          <span className="stat-icon">📉</span>
          <div>
            <div className="stat-value" style={{ color: "#ef4444" }}>KES {totalExpenses.toLocaleString()}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>Record Expense</h3>
          <form onSubmit={handleAdd} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Description *</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Flour, Sugar, Eggs" />
              </div>
              <div className="form-group">
                <label>Amount (KES) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="general">General</option>
                  <option value="direct">Direct (linked to order)</option>
                </select>
              </div>
              {form.type === "direct" && (
                <div className="form-group">
                  <label>Order ID</label>
                  <input type="number" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} placeholder="Order #" />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="outline-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="pink-btn" disabled={saving}>{saving ? "Saving..." : "Record Expense"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading-state">Loading expenses...</div> : expenses.length === 0 ? (
        <div className="empty-state"><span>📉</span><p>No expenses recorded yet</p></div>
      ) : (
        <div className="expenses-list">
          {expenses.map((exp) => (
            <div key={exp.id} className="expense-row">
              <div>
                <span className="expense-desc">{exp.description}</span>
                {exp.order_id && <span className="expense-order"> • Order #{exp.order_id}</span>}
                <span className="expense-type"> • {exp.type}</span>
              </div>
              <div>
                <span className="expense-amount">KES {parseFloat(exp.amount).toLocaleString()}</span>
                <span className="expense-date"> • {new Date(exp.date || exp.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
  }, [user]);

  if (!user || user.role !== "admin") return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "cakes", label: "Manage Cakes", icon: "🎂" },
    { id: "orders", label: "Manage Orders", icon: "📋" },
    { id: "money", label: "Track Money", icon: "💰" },
  ];

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>🎂</span>
          <div>
            <div className="admin-brand-name">Alicious Delicious</div>
            <div className="admin-brand-sub">Admin Panel</div>
          </div>
        </div>
        <div className="admin-user">
          <div className="admin-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="admin-user-name">{user.name.split(" ")[0]}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>
        <nav className="admin-nav">
          {tabs.map((t) => (
            <button key={t.id} className={`admin-nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={() => { logoutUser(); navigate("/"); }}>
          🚪 Logout
        </button>
      </aside>

      <main className="admin-main">
        {tab === "overview" && <Overview />}
        {tab === "cakes" && <ManageCakes />}
        {tab === "orders" && <ManageOrders />}
        {tab === "money" && <TrackMoney />}
      </main>
    </div>
  );
}
