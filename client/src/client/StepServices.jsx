import { useEffect, useState } from "react";
import { fmtRSD, fmtDur } from "../data/format.js";
import StepHeading from "./StepHeading.jsx";

export default function StepServices({ services, categories, selected, onSelect }) {
  const [activeCat, setActiveCat] = useState(categories[0] || "");

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.includes(activeCat)) setActiveCat(categories[0]);
  }, [categories, activeCat]);

  const list = services.filter((s) => s.cat === activeCat);

  return (
    <div>
      <StepHeading
        eyebrow="Korak 01"
        title="Izaberite uslugu"
        sub="Sve usluge obavlja master Milena lično, u svom ritmu."
      />

      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: "12px 22px",
              whiteSpace: "nowrap",
              fontFamily: "var(--serif)",
              fontSize: 18,
              fontStyle: activeCat === c ? "italic" : "normal",
              color: activeCat === c ? "var(--gold)" : "var(--muted)",
              borderBottom: activeCat === c ? "2px solid var(--bronze)" : "2px solid transparent",
              marginBottom: -1,
              transition: "all .2s ease",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))", gap: 16 }}>
        {list.map((s) => {
          const isSel = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="svc-card"
              data-selected={isSel}
            >
              {s.featured && (
                <span className="chip chip-gold" style={{ position: "absolute", top: 14, right: 14 }}>
                  Preporuka
                </span>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 22,
                    fontWeight: 500,
                    margin: 0,
                    color: isSel ? "var(--gold)" : "var(--parchment)",
                  }}
                >
                  {s.name}
                </h3>
              </div>
              <p style={{ color: "var(--parchment-dim)", margin: "8px 0 18px", fontSize: 13, lineHeight: 1.55 }}>
                {s.desc}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 14,
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
                    fontSize: 22,
                    fontStyle: "italic",
                    color: isSel ? "var(--gold)" : "var(--bronze)",
                  }}
                >
                  {fmtRSD(s.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
