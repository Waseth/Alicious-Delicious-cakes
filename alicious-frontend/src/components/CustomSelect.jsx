import { useState, useRef, useEffect } from "react";

export default function CustomSelect({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`cselect ${open ? "open" : ""}`} ref={ref}>
      <button type="button" className="cselect-trigger" onClick={() => setOpen(!open)}>
        <span className={selected ? "" : "cselect-placeholder"}>{selected ? selected.label : placeholder}</span>
        <svg className="cselect-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="cselect-dropdown">
          {options.map((o) => (
            <button key={o.value} type="button" className={`cselect-option ${value === o.value ? "selected" : ""}`} onClick={() => { onChange(o.value); setOpen(false); }}>
              {value === o.value && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}