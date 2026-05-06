import { useState } from "react";
import { MONTHS_SR, isoDate } from "../data/format.js";

function Legend({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 14, height: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

export default function CalendarView({ services, bookings }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const startDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const offset = (startDay + 6) % 7;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthNav = (delta) => {
    const v = new Date(view);
    v.setMonth(v.getMonth() + delta);
    setView(v);
  };

  const findService = (id) => services.find((s) => s.id === id);

  function getDayBookings(d) {
    if (!d) return [];
    const iso = isoDate(d);
    return bookings
      .filter((b) => b.date === iso && b.status !== "rejected")
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button className="btn btn-ghost" onClick={() => monthNav(-1)} style={{ padding: "10px 18px" }}>
          ‹ Prethodni
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontStyle: "italic", color: "var(--parchment)" }}>
            {MONTHS_SR[view.getMonth()]}{" "}
            <span style={{ color: "var(--gold)" }}>{view.getFullYear()}.</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => monthNav(1)} style={{ padding: "10px 18px" }}>
          Sledeći ›
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--muted-2)",
              textTransform: "uppercase",
              textAlign: "center",
              padding: "6px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ minHeight: 110 }} />;
          const dayB = getDayBookings(d);
          const isToday = isoDate(d) === isoDate(today);
          return (
            <div
              key={i}
              style={{
                minHeight: 110,
                padding: 8,
                background: isToday ? "rgba(168,120,66,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isToday ? "var(--bronze-deep)" : "var(--line-soft)"}`,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  color: isToday ? "var(--gold)" : "var(--parchment-dim)",
                  fontStyle: isToday ? "italic" : "normal",
                }}
              >
                <span>{d.getDate()}</span>
                {dayB.length > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      fontFamily: "var(--sans)",
                      fontStyle: "normal",
                      letterSpacing: "0.18em",
                    }}
                  >
                    {dayB.length}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayB.slice(0, 3).map((b) => {
                  const svc = findService(b.service);
                  const color =
                    b.status === "pending"
                      ? "var(--warn)"
                      : b.status === "completed"
                      ? "var(--gold)"
                      : "var(--burgundy-bright)";
                  return (
                    <div
                      key={b.id}
                      title={`${b.time} · ${svc?.name} · ${b.client.name}`}
                      style={{
                        fontSize: 10,
                        padding: "3px 6px",
                        borderRadius: 2,
                        background: "rgba(0,0,0,0.4)",
                        borderLeft: `2px solid ${color}`,
                        color: "var(--parchment)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--gold)",
                          fontWeight: 600,
                          fontFamily: "var(--serif)",
                        }}
                      >
                        {b.time}
                      </span>{" "}
                      {b.client.name.split(" ")[0]}
                    </div>
                  );
                })}
                {dayB.length > 3 && (
                  <div style={{ fontSize: 10, color: "var(--muted)", padding: "2px 6px" }}>
                    + {dayB.length - 3} još
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 18, fontSize: 11, color: "var(--muted)" }}>
        <Legend color="var(--burgundy-bright)" label="Potvrđeno" />
        <Legend color="var(--warn)" label="Na čekanju" />
        <Legend color="var(--gold)" label="Obavljeno" />
      </div>
    </div>
  );
}
