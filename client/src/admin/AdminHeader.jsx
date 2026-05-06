import { fmtDateLong } from "../data/format.js";

const TITLES = {
  overview: ["Pregled", "Sažetak vašeg ateljea danas"],
  requests: ["Zahtevi za termine", "Pregledajte i potvrdite nove zahteve"],
  calendar: ["Kalendar", "Vizuelni pregled svih potvrđenih termina"],
  clients: ["Klijenti", "Sve dame koje su prošle kroz atelje"],
};

export default function AdminHeader({ view, todayCount }) {
  const [t, sub] = TITLES[view] || ["", ""];
  const today = new Date();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingBottom: 24,
        marginBottom: 28,
        borderBottom: "1px solid var(--line-soft)",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div>
        <span className="eyebrow">{fmtDateLong(today)}</span>
        <h1 className="h-display" style={{ fontSize: 38, margin: "6px 0 4px" }}>
          {t}
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>{sub}</p>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span className="chip chip-gold">
          Danas: {todayCount} termin{todayCount === 1 ? "" : "a"}
        </span>
      </div>
    </div>
  );
}
