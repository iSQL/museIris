import { useMemo, useState } from "react";
import { fmtRSD, fmtDur } from "../data/format.js";
import ServiceFormModal from "./ServiceFormModal.jsx";

const FILTERS = [
  { id: "all", label: "Sve" },
  { id: "active", label: "Aktivne" },
  { id: "archived", label: "Arhivirane" },
];

export default function ServicesView({ services, categories, guard, onChanged }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // service or "new"

  const counts = useMemo(
    () => ({
      all: services.length,
      active: services.filter((s) => !s.archived).length,
      archived: services.filter((s) => s.archived).length,
    }),
    [services]
  );

  const list = useMemo(() => {
    return services
      .filter((s) => {
        if (filter === "active") return !s.archived;
        if (filter === "archived") return s.archived;
        return true;
      })
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.desc || "").toLowerCase().includes(q)
        );
      });
  }, [services, filter, search]);

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
          placeholder="Pretraga po nazivu, ID-u, opisu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => setEditing("new")}
          style={{ marginLeft: "auto" }}
        >
          Nova usluga
        </button>
      </div>

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
          Nema usluga u ovoj kategoriji.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {list.map((s) => (
            <button key={s.id} className="svc-card" onClick={() => setEditing(s)}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span className="chip chip-mute">{s.cat}</span>
                {s.featured && <span className="chip chip-gold">Preporuka</span>}
                {s.archived && <span className="chip chip-bad">Arhivirano</span>}
              </div>
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 20,
                  fontWeight: 500,
                  margin: 0,
                  color: s.archived ? "var(--muted)" : "var(--parchment)",
                  textDecoration: s.archived ? "line-through" : "none",
                }}
              >
                {s.name}
              </h3>
              <p
                style={{
                  color: "var(--parchment-dim)",
                  margin: "8px 0 14px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {s.desc || <span style={{ color: "var(--muted-2)" }}>Nema opisa.</span>}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 12,
                  borderTop: "1px dashed var(--line-soft)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  {fmtDur(s.duration)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 20,
                    fontStyle: "italic",
                    color: "var(--bronze)",
                  }}
                >
                  {fmtRSD(s.price)}
                </span>
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted-2)",
                }}
              >
                {s.id}
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <ServiceFormModal
          service={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
