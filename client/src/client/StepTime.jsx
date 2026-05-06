import { fmtDateLong, fmtDur } from "../data/format.js";
import StepHeading from "./StepHeading.jsx";

export default function StepTime({ slots, loading, selected, onSelect, date, service }) {
  if (!date || !service) {
    return <p style={{ color: "var(--muted)" }}>Vratite se i izaberite uslugu i datum.</p>;
  }

  const labels = { jutro: "Jutro", podne: "Popodne", vece: "Veče" };
  const groups = { jutro: [], podne: [], vece: [] };
  slots.forEach((s) => {
    const h = Number(s.label.split(":")[0]);
    if (h < 12) groups.jutro.push(s);
    else if (h < 17) groups.podne.push(s);
    else groups.vece.push(s);
  });

  return (
    <div>
      <StepHeading
        eyebrow="Korak 03"
        title="Izaberite vreme"
        sub={`${fmtDateLong(date)} · ${service.name} · ${fmtDur(service.duration)}`}
      />

      {loading && (
        <p style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)", fontSize: 16 }}>
          Učitavanje slobodnih termina…
        </p>
      )}

      {!loading && slots.length === 0 && (
        <p style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)", fontSize: 16 }}>
          Tog dana ne radimo. Molimo odaberite drugi datum.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {Object.entries(groups).map(([key, list]) =>
          list.length > 0 ? (
            <div key={key}>
              <div className="divider" style={{ marginBottom: 14 }}>{labels[key]}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                {list.map((s) => {
                  const disabled = s.taken || s.past;
                  const isSel = selected?.label === s.label;
                  return (
                    <button
                      key={s.label}
                      disabled={disabled}
                      onClick={() => onSelect(s)}
                      className="time-pill"
                      data-selected={isSel}
                    >
                      {s.label}
                      {s.taken && <span className="time-sub">zauzeto</span>}
                      {s.past && !s.taken && <span className="time-sub">prošlo</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
