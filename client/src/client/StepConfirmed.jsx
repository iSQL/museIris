import { Link } from "react-router-dom";
import { fmtRSD, fmtDur, fmtDateLong } from "../data/format.js";
import Ornament from "../components/Ornament.jsx";

export default function StepConfirmed({ id, service, date, time, onReset }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
      <Ornament width={50} />
      <span className="eyebrow" style={{ marginTop: 18, display: "block" }}>
        Hvala vam
      </span>
      <h2 className="h-display" style={{ fontSize: 48, margin: "10px 0 14px" }}>
        Vaš zahtev je <em style={{ fontStyle: "italic", color: "var(--gold)" }}>poslat</em>.
      </h2>
      <p
        style={{
          color: "var(--parchment-dim)",
          maxWidth: 520,
          margin: "0 auto 32px",
          fontSize: 15,
          lineHeight: 1.65,
        }}
      >
        Termin još nije potvrđen. Milena će ga pregledati i poslati vam potvrdu na telefon u toku dana.
      </p>
      <div
        className="card"
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "26px 36px",
          gap: 14,
          minWidth: 360,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "var(--bronze)",
            textTransform: "uppercase",
          }}
        >
          Broj zahteva
        </span>
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 28,
            fontStyle: "italic",
            color: "var(--gold)",
          }}
        >
          {id}
        </span>
        <div className="gold-rule" style={{ width: "100%" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--parchment)" }}>
            {service.name}
          </span>
          <span style={{ color: "var(--parchment-dim)" }}>{fmtDateLong(date)}</span>
          <span
            style={{
              color: "var(--gold)",
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 17,
            }}
          >
            {time.label} · {fmtDur(service.duration)} · {fmtRSD(service.price)}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to="/me">
          Pogledaj moje termine
        </Link>
        <button className="btn btn-ghost" onClick={onReset}>
          Zakaži još jedan termin
        </button>
      </div>
    </div>
  );
}
