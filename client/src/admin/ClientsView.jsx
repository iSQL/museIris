import { useEffect, useState } from "react";
import * as api from "../api.js";
import { fmtRSD, fmtDateShort } from "../data/format.js";

export default function ClientsView({ refreshKey }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listClients()
      .then((res) => setClients(res.clients))
      .catch((err) => setError(err.message || String(err)));
  }, [refreshKey]);

  const list = clients.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid var(--bad)",
            borderRadius: 2,
            color: "#d99a8b",
            fontSize: 13,
          }}
        >
          Greška pri učitavanju klijenata: {error}
        </div>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="input"
          placeholder="Pretraga klijenata…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <span
          style={{
            fontSize: 12,
            color: "var(--muted)",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
          }}
        >
          Ukupno: <span style={{ color: "var(--gold)" }}>{clients.length}</span>
        </span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="cli-row cli-head">
          <span>Klijent</span>
          <span>Kontakt</span>
          <span>Omiljeno</span>
          <span style={{ textAlign: "center" }}>Posete</span>
          <span style={{ textAlign: "right" }}>Potrošeno</span>
          <span style={{ textAlign: "right" }}>Poslednja</span>
        </div>
        {list.map((c, i) => (
          <div key={i} className="cli-row cli-item">
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2a1a14, #5a1320)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  color: "var(--gold)",
                  fontSize: 16,
                  border: "1px solid var(--line)",
                }}
              >
                {c.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span style={{ color: "var(--parchment)", fontSize: 14 }}>{c.name}</span>
            </span>
            <span style={{ color: "var(--parchment-dim)" }}>
              <div>{c.phone}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.email}</div>
            </span>
            <span>
              <span className="chip chip-mute">{c.favCat}</span>
            </span>
            <span
              style={{
                textAlign: "center",
                fontFamily: "var(--serif)",
                fontSize: 18,
                color: "var(--gold)",
                fontStyle: "italic",
              }}
            >
              {c.visits}
            </span>
            <span style={{ textAlign: "right", fontFamily: "var(--serif)", color: "var(--parchment)" }}>
              {fmtRSD(c.spent)}
            </span>
            <span style={{ textAlign: "right", color: "var(--parchment-dim)", fontSize: 12 }}>
              {c.lastDate ? fmtDateShort(new Date(c.lastDate)) : "—"}
            </span>
          </div>
        ))}
        {list.length === 0 && (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              color: "var(--muted)",
              fontFamily: "var(--serif)",
              fontStyle: "italic",
            }}
          >
            Nema rezultata.
          </div>
        )}
      </div>
    </div>
  );
}
