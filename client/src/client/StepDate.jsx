import MonthCalendar from "../components/MonthCalendar.jsx";
import StepHeading from "./StepHeading.jsx";

export default function StepDate({ selected, onSelect, workingHours }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + 60);
  return (
    <div>
      <StepHeading
        eyebrow="Korak 02"
        title="Izaberite datum"
        sub="Slobodno možete birati do 60 dana unapred. Nedeljom ne radimo."
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,360px)", gap: 32, alignItems: "start" }}>
        <MonthCalendar
          value={selected}
          onChange={onSelect}
          minDate={today}
          maxDate={max}
          workingHours={workingHours}
        />
        <div className="card" style={{ padding: 24 }}>
          <span className="eyebrow">Radno vreme</span>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Ponedeljak — Sreda", "09:00 — 19:00"],
              ["Četvrtak — Petak", "09:00 — 20:00"],
              ["Subota", "10:00 — 16:00"],
              ["Nedelja", "Zatvoreno"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingBottom: 8,
                  borderBottom: "1px dashed var(--line-soft)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--parchment-dim)" }}>{k}</span>
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    color: v === "Zatvoreno" ? "var(--muted-2)" : "var(--gold)",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 22,
              padding: 16,
              background: "rgba(168,120,66,0.06)",
              border: "1px solid var(--line-soft)",
              borderRadius: 2,
            }}
          >
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--gold)", fontSize: 16 }}>
              Napomena
            </span>
            <p style={{ fontSize: 13, color: "var(--parchment-dim)", margin: "6px 0 0", lineHeight: 1.55 }}>
              Termini se zakazuju najmanje 30 minuta unapred. Otkazivanje je moguće do 4h pre termina.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
