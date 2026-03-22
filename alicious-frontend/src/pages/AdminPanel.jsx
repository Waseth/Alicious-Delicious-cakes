import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { getDashboard, getFinance, getAllOrders, getCakes, createCake, updateCake, deleteCake, startBaking, markReady, markDelivered, getExpenses, createExpense } from "../utils/api";

const STATUS = {
  order_received:     { label:"Received",  color:"#d97706", bg:"#fffbeb" },
  baking_in_progress: { label:"Baking",    color:"#2563eb", bg:"#eff6ff" },
  cake_ready:         { label:"Ready",     color:"#059669", bg:"#f0fdf4" },
  delivered:          { label:"Delivered", color:"#6b7280", bg:"#f9fafb" },
  cancelled:          { label:"Cancelled", color:"#dc2626", bg:"#fff5f5" },
};

const I = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  cake: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 14v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4"/><path d="M12 2v4"/><path d="M2 14h20"/><path d="M6 14V9a6 6 0 0 1 12 0v5"/><path d="M9 2h6"/></svg>,
  orders: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>,
  money: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function BarChart({ data, color, label }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="a-chart">
      <div className="a-chart-label">{label}</div>
      <div className="a-chart-bars">
        {data.map((d) => (
          <div key={d.month} className="a-bar-col">
            <div className="a-bar-tooltip">KES {Math.round(d.amount).toLocaleString()}</div>
            <div className="a-bar" style={{ height:`${Math.max((d.amount / max) * 100, 2)}%`, background:`linear-gradient(to top, ${color}, ${color}cc)` }} />
            <span className="a-bar-label">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboard().then((r) => setStats(r.data)),
      getFinance(year).then((r) => setFinance(r.data)),
    ]).finally(() => setLoading(false));
  }, [year]);
  return (
    <div className="a-content">
      <div className="a-page-header"><div><h1>Overview</h1><p>Your business at a glance</p></div></div>
      {loading ? (
        <div className="a-stat-grid">{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:100, borderRadius:8 }} />)}</div>
      ) : stats && (
        <div className="a-stat-grid">
          {[
            { label:"Total Orders",     value:stats.total_orders,                                        icon:I.orders, accent:"#d42f5a" },
            { label:"Total Revenue",    value:`KES ${parseFloat(stats.total_revenue).toLocaleString()}`,  icon:I.money,  accent:"#059669" },
            { label:"Total Expenses",   value:`KES ${parseFloat(stats.total_expenses).toLocaleString()}`, icon:I.money,  accent:"#dc2626" },
            { label:"Net Profit",       value:`KES ${parseFloat(stats.net_profit).toLocaleString()}`,     icon:I.grid,   accent:stats.net_profit >= 0 ? "#059669" : "#dc2626" },
            { label:"Pending Balances", value:`KES ${parseFloat(stats.pending_balances).toLocaleString()}`,icon:I.money, accent:"#d97706" },
          ].map((c, i) => (
            <div key={c.label} className="a-stat-card" style={{ animationDelay:`${i * 0.07}s` }}>
              <div className="a-stat-icon" style={{ color:c.accent, background:c.accent+"18" }}>{c.icon}</div>
              <div className="a-stat-val" style={{ color:c.accent }}>{c.value}</div>
              <div className="a-stat-lbl">{c.label}</div>
            </div>
          ))}
        </div>
      )}
      {finance && (
        <div className="a-charts-card">
          <div className="a-charts-head">
            <h3>Monthly Performance</h3>
            <div className="year-nav">
              <button onClick={() => setYear(y => y - 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span>{year}</span>
              <button onClick={() => setYear(y => y + 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div className="a-charts-row">
            <BarChart data={finance.revenue}  color="#d42f5a" label="Revenue (KES)" />
            <BarChart data={finance.expenses} color="#dc2626" label="Expenses (KES)" />
            <BarChart data={finance.profit}   color="#059669" label="Profit (KES)" />
          </div>
        </div>
      )}
    </div>
  );
}

function ManageCakes() {
  const [cakes, setCakes] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", description:"", base_price:"", category:"birthday", flavor:"classic", image_url:"", featured:false });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const load = () => { setLoading(true); getCakes({ per_page:100 }).then((r) => setCakes(r.data?.items || [])).finally(() => setLoading(false)); };
  useEffect(load, []);
  const openNew = () => { setEditing(null); setForm({ name:"",description:"",base_price:"",category:"birthday",flavor:"classic",image_url:"",featured:false }); setShowForm(true); setError(""); };
  const openEdit = (c) => { setEditing(c); setForm({ name:c.name,description:c.description||"",base_price:c.base_price,category:c.category,flavor:c.flavor,image_url:c.image_url||"",featured:c.featured }); setShowForm(true); setError(""); };
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try { if (editing) await updateCake(editing.id, {...form, base_price:parseFloat(form.base_price)}); else await createCake({...form, base_price:parseFloat(form.base_price)}); setShowForm(false); load(); }
    catch (err) { setError(err.message || "Save failed"); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    try { await deleteCake(confirmDelete.id); setConfirmDelete(null); load(); }
    catch (err) { setConfirmDelete(null); setTimeout(() => alert(err.message || "Cannot delete cake"), 100); }
  };
  return (
    <div className="a-content">
      {confirmDelete && <ConfirmDialog title="Delete Cake" message={`Delete "${confirmDelete.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} confirmLabel="Delete" danger />}
      <div className="a-page-header">
        <div><h1>Manage Cakes</h1><p>{cakes.length} cakes in catalog</p></div>
        <button className="btn-pink" onClick={openNew}>{I.plus} Add Cake</button>
      </div>
      {showForm && (
        <div className="a-form-card">
          <div className="a-form-head"><h3>{editing ? "Edit Cake" : "New Cake"}</h3><button className="icon-btn" onClick={() => setShowForm(false)}>{I.x}</button></div>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSave} className="a-form">
            <div className="field-row">
              <div className="field"><label>Name *</label><input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} required placeholder="e.g. Chocolate Fudge Cake" /></div>
              <div className="field"><label>Price (KES) *</label><input type="number" value={form.base_price} onChange={(e) => setForm({...form,base_price:e.target.value})} required min="1" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Category</label><select value={form.category} onChange={(e) => setForm({...form,category:e.target.value})}>{["birthday","wedding","graduation","casual"].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div className="field"><label>Flavor</label><select value={form.flavor} onChange={(e) => setForm({...form,flavor:e.target.value})}>{["classic","chocolate","fruity","specialty"].map(f=><option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} rows={2} /></div>
            <div className="field"><label>Image URL</label><input type="url" value={form.image_url} onChange={(e) => setForm({...form,image_url:e.target.value})} placeholder="https://…" /></div>
            <label className="toggle-label"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form,featured:e.target.checked})} /><span>Show as featured on homepage</span></label>
            <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn-pink" disabled={saving}>{saving ? "Saving…" : "Save Cake"}</button></div>
          </form>
        </div>
      )}
      {loading ? (
        <div className="a-cakes-grid">{[1,2,3,4].map(i=><div key={i} className="a-cake-row skeleton" style={{height:70}} />)}</div>
      ) : (
        <div className="a-cakes-grid">
          {cakes.map((c) => (
            <div key={c.id} className="a-cake-row">
              <div className="a-cake-img">{c.image_url ? <img src={c.image_url} alt={c.name} /> : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fad0db" strokeWidth="1.5"><path d="M18 14v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4"/><path d="M12 2v4"/><path d="M2 14h20"/><path d="M6 14V9a6 6 0 0 1 12 0v5"/></svg>}</div>
              <div className="a-cake-info"><div className="a-cake-name">{c.name} {c.featured && <span className="featured-pill">Featured</span>}</div><div className="a-cake-meta">KES {parseFloat(c.base_price).toLocaleString()} · {c.category} · {c.flavor}</div></div>
              <div className="a-row-actions"><button className="btn-icon-edit" onClick={() => openEdit(c)}>{I.edit}</button><button className="btn-icon-del" onClick={() => setConfirmDelete(c)}>{I.trash}</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManageOrders() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(""); const [acting, setActing] = useState(null);
  const load = () => { setLoading(true); const p = filter ? {status:filter} : {}; getAllOrders(p).then((r) => setOrders(r.data?.orders || [])).catch(() => setOrders([])).finally(() => setLoading(false)); };
  useEffect(load, [filter]);
  const doAction = async (fn, id) => { setActing(id); try { await fn(id); load(); } catch (err) { alert(err.message); } finally { setActing(null); } };
  return (
    <div className="a-content">
      <div className="a-page-header"><div><h1>Manage Orders</h1><p>{orders.length} orders</p></div></div>
      <div className="a-filter-row">
        {["","order_received","baking_in_progress","cake_ready","delivered","cancelled"].map((s) => (
          <button key={s} className={`filter-pill ${filter===s?"active":""}`} onClick={() => setFilter(s)}>{s ? STATUS[s]?.label : "All"}</button>
        ))}
      </div>
      {loading ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:160,borderRadius:8}} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="a-empty"><p>No orders found</p></div>
      ) : (
        <div className="a-orders-list">
          {orders.map((order, idx) => {
            const s = STATUS[order.status] || STATUS.order_received;
            return (
              <div key={order.id} className="a-order-card" style={{animationDelay:`${idx*0.05}s`}}>
                <div className="a-order-top">
                  <div className="a-order-id">Order #{order.id} <span className="a-order-customer">· {order.user_name || "Customer"}</span></div>
                  <div className="a-status-pill" style={{color:s.color,background:s.bg}}>{s.label}</div>
                </div>
                <div className="a-order-items-row">{order.items?.map((i) => <span key={i.id} className="item-chip">{i.cake_name} ×{i.quantity}</span>)}</div>
                <div className="a-order-meta-row">
                  <span>KES {parseFloat(order.total_price).toLocaleString()}</span>
                  <span style={{color:order.deposit_paid?"#059669":"#dc2626"}}>{order.deposit_paid?"✓ Deposit paid":"⏳ Deposit pending"}</span>
                  <span style={{color:order.balance_paid?"#059669":"#d97706"}}>{order.balance_paid?"✓ Balance paid":"Balance pending"}</span>
                  {order.delivery_date && <span>📅 {new Date(order.delivery_date).toLocaleDateString()}</span>}
                </div>
                {order.custom_message && <div className="a-order-note">"{order.custom_message}"</div>}
                <div className="a-order-actions">
                  {order.status==="order_received" && order.deposit_paid && <button className="btn-action blue" onClick={() => doAction(startBaking,order.id)} disabled={acting===order.id}>{acting===order.id?"…":"Start Baking"}</button>}
                  {order.status==="baking_in_progress" && <button className="btn-action green" onClick={() => doAction(markReady,order.id)} disabled={acting===order.id}>{acting===order.id?"…":"Mark Ready"}</button>}
                  {order.status==="cake_ready" && <button className="btn-action pink" onClick={() => doAction(markDelivered,order.id)} disabled={acting===order.id}>{acting===order.id?"…":"Mark Delivered"}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrackMoney() {
  const [expenses, setExpenses] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", amount:"", type:"overhead", order_id:"" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const load = () => { setLoading(true); getExpenses({per_page:50}).then((r) => setExpenses(r.data?.expenses || [])).catch(() => setExpenses([])).finally(() => setLoading(false)); };
  useEffect(load, []);
  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { title:form.title, amount:parseFloat(form.amount), type:form.type };
      if (form.type==="direct" && form.order_id) payload.order_id = parseInt(form.order_id);
      await createExpense(payload);
      setShowForm(false); setForm({title:"",amount:"",type:"overhead",order_id:""}); load();
    } catch (err) { setError(err.message || "Failed to save"); } finally { setSaving(false); }
  };
  const total = expenses.reduce((s,e) => s + parseFloat(e.amount), 0);
  return (
    <div className="a-content">
      <div className="a-page-header">
        <div><h1>Expenses</h1><p>Record and monitor business expenses</p></div>
        <button className="btn-pink" onClick={() => setShowForm(!showForm)}>{I.plus} Add Expense</button>
      </div>
      <div className="a-expense-summary">
        <div className="a-stat-card"><div className="a-stat-icon" style={{color:"#dc2626",background:"#fff5f5"}}>{I.money}</div><div className="a-stat-val" style={{color:"#dc2626"}}>KES {total.toLocaleString()}</div><div className="a-stat-lbl">Total Expenses</div></div>
      </div>
      {showForm && (
        <div className="a-form-card">
          <div className="a-form-head"><h3>Record Expense</h3><button className="icon-btn" onClick={() => setShowForm(false)}>{I.x}</button></div>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleAdd} className="a-form">
            <div className="field-row">
              <div className="field"><label>Title *</label><input value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} required placeholder="e.g. Flour, Sugar, Eggs" /></div>
              <div className="field"><label>Amount (KES) *</label><input type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} required min="1" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Type</label><select value={form.type} onChange={(e) => setForm({...form,type:e.target.value})}><option value="overhead">Overhead (general)</option><option value="direct">Direct (linked to order)</option></select></div>
              {form.type==="direct" && <div className="field"><label>Order ID</label><input type="number" value={form.order_id} onChange={(e) => setForm({...form,order_id:e.target.value})} placeholder="e.g. 5" /></div>}
            </div>
            <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn-pink" disabled={saving}>{saving?"Saving…":"Record Expense"}</button></div>
          </form>
        </div>
      )}
      {loading ? (
        <div className="dots-loader"><span/><span/><span/></div>
      ) : expenses.length === 0 ? (
        <div className="a-empty"><p>No expenses recorded yet</p></div>
      ) : (
        <div className="a-expenses-list">
          {expenses.map((exp) => (
            <div key={exp.id} className="a-expense-row">
              <div className="a-exp-dot" style={{background:exp.type==="direct"?"#d42f5a":"#6b7280"}} />
              <div className="a-exp-info"><div className="a-exp-title">{exp.title}</div><div className="a-exp-meta">{exp.type}{exp.order_id?` · Order #${exp.order_id}`:""} · {exp.date}</div></div>
              <div className="a-exp-amount">KES {parseFloat(exp.amount).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  useEffect(() => { if (user && user.role !== "admin") navigate("/"); }, [user]);
  if (!user || user.role !== "admin") return null;
  const tabs = [
    { id:"overview", label:"Overview",      short:"Overview", icon:I.grid   },
    { id:"cakes",    label:"Manage Cakes",  short:"Cakes",    icon:I.cake   },
    { id:"orders",   label:"Manage Orders", short:"Orders",   icon:I.orders },
    { id:"money",    label:"Expenses",      short:"Expenses", icon:I.money  },
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">🎂</span>
          <div><div className="admin-brand-name">Alicious Delicious</div><div className="admin-brand-sub">Admin Panel</div></div>
        </div>
        <div className="admin-user-chip">
          <div className="admin-av">{user.name.charAt(0).toUpperCase()}</div>
          <div><div className="admin-av-name">{user.name.split(" ")[0]}</div><div className="admin-av-role">Administrator</div></div>
        </div>
        <nav className="admin-nav">
          {tabs.map((t) => (
            <button key={t.id} className={`admin-nav-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
              <span className="nav-btn-icon">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-logout-btn" onClick={() => { logoutUser(); navigate("/"); }}>
          {I.logout}<span>Sign Out</span>
        </button>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <div className="topbar-title">{tabs.find((t) => t.id===tab)?.label}</div>
          <div className="admin-av small">{user.name.charAt(0).toUpperCase()}</div>
        </header>
        <div className="admin-page">
          {tab==="overview" && <Overview />}
          {tab==="cakes"    && <ManageCakes />}
          {tab==="orders"   && <ManageOrders />}
          {tab==="money"    && <TrackMoney />}
        </div>
      </div>
      <nav className="admin-bottom-bar">
        {tabs.map((t) => (
          <button key={t.id} className={`admin-bottom-item ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            <span className="admin-bottom-icon">{t.icon}</span>
            <span className="admin-bottom-label">{t.short}</span>
          </button>
        ))}
        <button className="admin-bottom-item" onClick={() => { logoutUser(); navigate("/"); }}>
          <span className="admin-bottom-icon">{I.logout}</span>
          <span className="admin-bottom-label">Out</span>
        </button>
      </nav>
    </div>
  );
}