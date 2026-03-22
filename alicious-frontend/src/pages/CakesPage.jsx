import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCakes } from "../utils/api";
import CakeCard from "../components/CakeCard";
import CustomSelect from "../components/CustomSelect";

const CAT_OPTS = [
  { value:"", label:"All Occasions" },
  { value:"birthday", label:"Birthday" },
  { value:"wedding", label:"Wedding" },
  { value:"graduation", label:"Graduation" },
  { value:"casual", label:"Casual" },
];
const FLAVOR_OPTS = [
  { value:"", label:"All Flavors" },
  { value:"classic", label:"Classic" },
  { value:"chocolate", label:"Chocolate" },
  { value:"fruity", label:"Fruity" },
  { value:"specialty", label:"Specialty" },
];
const PRICE_OPTS = [
  { value:"", label:"All Prices" },
  { value:"budget", label:"Budget (under KES 1,500)" },
  { value:"mid", label:"Mid (KES 1,500–4,000)" },
  { value:"premium", label:"Premium (KES 4,000+)" },
];

export default function CakesPage() {
  const [cakes, setCakes] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [showSearch, setShowSearch] = useState(false);
  const [category, setCategory] = useState(""); const [flavor, setFlavor] = useState(""); const [priceTier, setPriceTier] = useState("");
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const p = { page, per_page: 12 };
    if (search) p.search = search;
    if (category) p.category = category;
    if (flavor) p.flavor = flavor;
    if (priceTier) p.price_tier = priceTier;
    getCakes(p).then((r) => { setCakes(r.data?.items || []); setTotalPages(r.data?.pages || 1); }).catch(() => setCakes([])).finally(() => setLoading(false));
  }, [search, category, flavor, priceTier, page]);

  const clear = () => { setSearch(""); setCategory(""); setFlavor(""); setPriceTier(""); setPage(1); };
  const hasFilter = search || category || flavor || priceTier;

  return (
    <div className="cakes-page">
      <div className="cakes-hero">
        <h1>Our Cake Collection</h1>
        <p>Every cake made fresh to order with premium ingredients</p>
      </div>

      <div className="cakes-toolbar">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button className="search-toggle" onClick={() => setShowSearch(!showSearch)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          {showSearch && <input className="search-input" placeholder="Search cakes…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} autoFocus />}
        </div>
        <div className="filters">
          <CustomSelect value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={CAT_OPTS} placeholder="All Occasions" />
          <CustomSelect value={flavor}   onChange={(v) => { setFlavor(v); setPage(1); }}   options={FLAVOR_OPTS} placeholder="All Flavors" />
          <CustomSelect value={priceTier} onChange={(v) => { setPriceTier(v); setPage(1); }} options={PRICE_OPTS} placeholder="All Prices" />
          {hasFilter && <button className="clear-filters" onClick={clear}>Clear ✕</button>}
        </div>
      </div>

      {loading ? (
        <div className="cakes-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="cake-skeleton skeleton" />)}</div>
      ) : cakes.length === 0 ? (
        <div className="empty-hero" style={{ padding:"4rem 2rem" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No cakes found</p>
          <button className="btn-pink" onClick={clear}>Clear Filters</button>
        </div>
      ) : (
        <div className="cakes-grid">{cakes.map(c => <CakeCard key={c.id} cake={c} />)}</div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><span>🎂</span><span>Alicious Delicious Cakes</span></div>
          <p className="footer-credit">© {new Date().getFullYear()} Alicious Delicious Cakes. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/cakes">Cakes</Link>
            <Link to="/contact">Contact</Link>
            <a href="https://wa.me/254723619572" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}