import { fmtRSD, fmtDur, fmtDateShort } from "../data/format.js";
import StatusChip from "../components/StatusChip.jsx";

function Stat({ label, value, accent, big }) {
  const colors = { warn: "var(--warn)", ok: "#a3c595", gold: "var(--gold)" };
  return (
    <div className="card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 40,
          height: 2,
          background: colors[accent] || "var(--bronze)",
        }}
      />
      <span className="eyebrow">{label}</span>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: big ? 32 : 44,
          color: "var(--parchment)",
          marginTop: 10,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function OverviewView({ services, counts, todayBookings, upcoming, monthRevenue }) {
  const findService = (id) => services.find((s) => s.id === id);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <Stat label="Zahtevi na čekanju" value={counts.pending} accent="warn" />
      <Stat label="Potvrđeno" value={counts.approved} accent="ok" />
      <Stat label="Obavljeno (ukupno)" value={counts.completed} accent="gold" />
      <Stat label="Prihod (obavljeno)" value={fmtRSD(monthRevenue)} accent="gold" big />

      <div className="card" style={{ padding: 22, gridColumn: "span 2", minHeight: 240 }}>
        <span className="eyebrow">Danas</span>
        <h3 className="h-display" style={{ fontSize: 24, margin: "6px 0 14px" }}>
          Današnji raspored
        </h3>
        {todayBookings.length === 0 && (
          <p style={{ color: "var(--muted)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
            Slobodan dan. Sjajna prilika za malu pauzu.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {todayBookings.map((b) => {
            const svc = findService(b.service);
            return (
              <div
                key={b.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 2,
                  borderLeft: "2px solid var(--bronze)",
                }}
              >
                <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", color: "var(--gold)" }}>
                  {b.time}
                </span>
                <span>
                  <div style={{ color: "var(--parchment)" }}>{b.client.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {svc?.name} · {fmtDur(svc?.duration)}
                  </div>
                </span>
                <span style={{ fontFamily: "var(--serif)", color: "var(--parchment-dim)" }}>
                  {fmtRSD(svc?.price || 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 22, gridColumn: "span 2" }}>
        <span className="eyebrow">Narednih dana</span>
        <h3 className="h-display" style={{ fontSize: 24, margin: "6px 0 14px" }}>
          Najavljeni termini
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcoming.slice(0, 6).map((b) => {
            const svc = findService(b.service);
            return (
              <div
                key={b.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px dashed var(--line-soft)",
                  fontSize: 13,
                }}
              >
                <span style={{ fontFamily: "var(--serif)", color: "var(--parchment-dim)" }}>
                  {fmtDateShort(new Date(b.date))} ·{" "}
                  <span style={{ color: "var(--gold)", fontStyle: "italic" }}>{b.time}</span>
                </span>
                <span style={{ color: "var(--parchment)" }}>
                  {b.client.name} <span style={{ color: "var(--muted)" }}>— {svc?.name}</span>
                </span>
                <StatusChip status={b.status} />
              </div>
            );
          })}
          {upcoming.length === 0 && (
            <p style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
              Nema najavljenih termina.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
