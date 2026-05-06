import { fmtRSD, fmtDur, fmtDateShort } from "../data/format.js";

function SummaryCell({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 80 }}>
      <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted-2)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--serif)",
          fontSize: 15,
          color: highlight ? "var(--gold)" : "var(--parchment)",
          fontStyle: highlight ? "italic" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function BookingSummary({ service, date, time }) {
  return (
    <div style={{ display: "flex", gap: 22, fontSize: 12, alignItems: "center", flexWrap: "wrap" }}>
      <SummaryCell label="Usluga" value={service?.name || "—"} />
      <SummaryCell label="Datum" value={date ? fmtDateShort(date) : "—"} />
      <SummaryCell label="Vreme" value={time ? `${time.label}` : "—"} />
      <SummaryCell label="Trajanje" value={service ? fmtDur(service.duration) : "—"} />
      <SummaryCell label="Cena" value={service ? fmtRSD(service.price) : "—"} highlight />
    </div>
  );
}
