import { useState, useEffect } from "react";
import { getCakes } from "../utils/api";
import CakeCard from "../components/CakeCard";

const CATEGORIES = ["", "birthday", "wedding", "graduation", "casual"];
const FLAVORS = ["", "classic", "chocolate", "fruity", "specialty"];
const PRICE_TIERS = [
  { value: "", label: "All Prices" },
  { value: "budget", label: "Budget (under KES 1,500)" },
  { value: "mid", label: "Mid (KES 1,500–4,000)" },
  { value: "premium", label: "Premium (KES 4,000+)" },
];

export default function CakesPage() {
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [category, setCategory] = useState("");
  const [flavor, setFlavor] = useState("");
  const [priceTier, setPriceTier] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCakes = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (flavor) params.flavor = flavor;
      if (priceTier) params.price_tier = priceTier;
      const res = await getCakes(params);
      setCakes(res.data?.items || []);
      setTotalPages(res.data?.pages || 1);
    } catch (err) {
      setCakes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCakes(); }, [search, category, flavor, priceTier, page]);

  const clearFilters = () => { setSearch(""); setCategory(""); setFlavor(""); setPriceTier(""); setPage(1); };

  return (
    <div className="cakes-page">
      <div className="cakes-hero">
        <h1>Our Cake Collection</h1>
        <p>Every cake made fresh to order with premium ingredients</p>
      </div>

      <div className="cakes-toolbar">
        <div className="search-area">
          <button className="search-toggle" onClick={() => setShowSearch(!showSearch)}>
            🔍
          </button>
          {showSearch && (
            <input
              className="search-input"
              type="text"
              placeholder="Search cakes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              autoFocus
            />
          )}
        </div>

        <div className="filters">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Occasions</option>
            {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={flavor} onChange={(e) => { setFlavor(e.target.value); setPage(1); }}>
            <option value="">All Flavors</option>
            {FLAVORS.slice(1).map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
          </select>
          <select value={priceTier} onChange={(e) => { setPriceTier(e.target.value); setPage(1); }}>
            {PRICE_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {(search || category || flavor || priceTier) && (
            <button className="clear-filters" onClick={clearFilters}>Clear ✕</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="cake-skeleton" />)}
        </div>
      ) : cakes.length === 0 ? (
        <div className="empty-state">
          <span>🎂</span>
          <p>No cakes found. Try different filters!</p>
          <button className="pink-btn" onClick={clearFilters}>Clear Filters</button>
        </div>
      ) : (
        <div className="cakes-grid">
          {cakes.map((cake) => <CakeCard key={cake.id} cake={cake} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
