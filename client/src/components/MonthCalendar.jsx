import { useState } from "react";
import { MONTHS_SR, isoDate } from "../data/format.js";

export default function MonthCalendar({
  value,
  onChange,
  workingHours = {},
  disabledDates = new Set(),
  minDate,
  maxDate,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const initial = value ? new Date(value) : new Date();
  const [view, setView] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const startDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const offset = (startDay + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const isClosed = (d) => workingHours[d.getDay()] === null;
  const isPast = (d) => d < today;
  const beforeMin = (d) => minDate && d < minDate;
  const afterMax = (d) => maxDate && d > maxDate;

  const monthNav = (delta) => {
    const v = new Date(view);
    v.setMonth(v.getMonth() + delta);
    setView(v);
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <button className="cal-nav" onClick={() => monthNav(-1)} aria-label="Prethodni mesec">‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontStyle: "italic", color: "var(--parchment)" }}>
            {MONTHS_SR[view.getMonth()]}
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--muted)" }}>
            {view.getFullYear()}.
          </div>
        </div>
        <button className="cal-nav" onClick={() => monthNav(1)} aria-label="Sledeći mesec">›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "var(--muted-2)",
              textTransform: "uppercase",
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoDate(d);
          const closed = isClosed(d);
          const past = isPast(d) || beforeMin(d) || afterMax(d);
          const blocked = disabledDates.has(iso);
          const disabled = closed || past || blocked;
          const selected = value && isoDate(value) === iso;
          const isToday = iso === isoDate(today);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(d)}
              className={`cal-cell ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
            >
              <span>{d.getDate()}</span>
              {isToday && !selected && <span className="dot" />}
              {closed && !past && <span className="closed-mark">✕</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
