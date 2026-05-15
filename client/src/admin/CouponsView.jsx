import { useEffect, useMemo, useState } from "react";
import * as api from "../api.js";
import { fmtRSD } from "../data/format.js";
import CouponFormModal from "./CouponFormModal.jsx";

const FILTERS = [
  { id: "all", label: "Svi" },
  { id: "active", label: "Aktivni" },
  { id: "inactive", label: "Neaktivni" },
];

function describeDiscount(c) {
  if (c.discountPercent) return `${c.discountPercent}%`;
  if (c.discountAmount) return fmtRSD(c.discountAmount);
  return "—";
}

function describeUsage(c) {
  if (c.maxActivations == null) return `${c.activationsUsed} / ∞`;
  return `${c.activationsUsed} / ${c.maxActivations}`;
}

function describeExpiry(c) {
  if (!c.expiresAt) return "—";
  const d = new Date(c.expiresAt);
  return d.toLocaleDateString("sr-Latn-RS");
}

export default function CouponsView({ guard }) {
  const [coupons, setCoupons] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // coupon or "new"
  const [error, setError] = useState(null);

  async function load() {
    try {
      const res = await guard(() => api.listCoupons());
      if (!res) return;
      setCoupons(res.coupons);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => ({
      all: coupons.length,
      active: coupons.filter((c) => c.active).length,
      inactive: coupons.filter((c) => !c.active).length,
    }),
    [coupons]
  );

  const list = useMemo(() => {
    return coupons
      .filter((c) => {
        if (filter === "active") return c.active;
        if (filter === "inactive") return !c.active;
        return true;
      })
      .filter((c) => {
        if (!search) return true;
        return c.code.toLowerCase().includes(search.toLowerCase());
      });
  }, [coupons, filter, search]);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: "var(--ink-2)",
            border: "1px solid var(--line-soft)",
            borderRadius: 999,
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              data-active={filter === f.id}
              className="filter-pill"
            >
              {f.label}
              <span style={{ opacity: 0.6, marginLeft: 6 }}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <input
          className="input"
          placeholder="Pretraga po kodu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => setEditing("new")}
          style={{ marginLeft: "auto" }}
        >
          Novi kupon
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: "1px solid var(--bad)",
            borderRadius: 2,
            color: "#d99a8b",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {list.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--muted)",
            fontStyle: "italic",
            fontFamily: "var(--serif)",
          }}
        >
          Nema kupona u ovoj kategoriji.
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div
            className="req-row req-head"
            style={{ gridTemplateColumns: "minmax(0,1.2fr) 110px 130px 140px 90px" }}
          >
            <span>Kod</span>
            <span>Popust</span>
            <span>Iskorišćeno</span>
            <span>Ističe</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => setEditing(c)}
              className="req-row req-item"
              style={{ gridTemplateColumns: "minmax(0,1.2fr) 110px 130px 140px 90px" }}
            >
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--gold)", fontSize: 16 }}>
                {c.code}
              </span>
              <span style={{ color: "var(--parchment)" }}>{describeDiscount(c)}</span>
              <span style={{ color: "var(--parchment-dim)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {describeUsage(c)}
              </span>
              <span style={{ color: "var(--parchment-dim)" }}>{describeExpiry(c)}</span>
              <span style={{ textAlign: "right" }}>
                <span className={`chip ${c.active ? "chip-ok" : "chip-mute"}`}>
                  {c.active ? "Aktivan" : "Neaktivan"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <CouponFormModal
          coupon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
