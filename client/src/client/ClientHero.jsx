import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";

export default function ClientHero() {
  return (
    <header
      style={{
        position: "relative",
        padding: "100px 32px 80px",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0a0506 0%, #0a0809 80%)",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: `
            radial-gradient(ellipse 50% 80% at 80% 30%, rgba(139,26,43,0.35), transparent 60%),
            radial-gradient(ellipse 30% 50% at 85% 50%, rgba(90,19,32,0.5), transparent 65%),
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0,0,0,0.8), transparent 60%)
          `,
        }}
      />
      <div
        style={{
          position: "absolute", top: 0, right: 0, width: "55%", height: "100%",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><defs><radialGradient id='g1' cx='40%25' cy='35%25' r='40%25'><stop offset='0%25' stop-color='%23a52338' stop-opacity='0.7'/><stop offset='100%25' stop-color='%235a1320' stop-opacity='0'/></radialGradient><radialGradient id='g2' cx='60%25' cy='40%25' r='30%25'><stop offset='0%25' stop-color='%23ff8090' stop-opacity='0.4'/><stop offset='100%25' stop-color='%238b1a2b' stop-opacity='0'/></radialGradient></defs><rect width='600' height='800' fill='url(%23g1)'/><rect width='600' height='800' fill='url(%23g2)'/></svg>\")",
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.6, filter: "blur(2px)",
          maskImage: "linear-gradient(270deg, black, transparent)",
          WebkitMaskImage: "linear-gradient(270deg, black, transparent)",
        }}
      />

      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
        <BrandMark size={56} withName tagline="atelier" />

        <div style={{ marginTop: 70, maxWidth: 640 }}>
          <span className="eyebrow">SALON NOKTIJU · ŽABARI</span>
          <h1 className="h-display" style={{ fontSize: 80, marginTop: 16, marginBottom: 24 }}>
            Negovani <em style={{ fontStyle: "italic", color: "var(--gold)" }}>detalji</em>,<br />
            tihi <em style={{ fontStyle: "italic", color: "var(--gold)" }}>luksuz</em>.
          </h1>
          <p
            style={{
              fontSize: 17, color: "var(--parchment-dim)", lineHeight: 1.7,
              maxWidth: 480, marginBottom: 36,
            }}
          >
            Manikir i pedikir tretmani u kamernoj atmosferi ateljea Muse Iris.
            Jedna stolica, jedan par ruku, vaše vreme — bez žurbe.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <a className="btn btn-primary" href="#booking">Zakaži termin</a>
            <Link className="btn btn-ghost" to="/services">Pogledaj usluge</Link>
          </div>
          <div style={{ marginTop: 60, display: "flex", gap: 36, flexWrap: "wrap" }}>
            {[
              ["Radno vreme", "Pon–Pet  09–20\nSub  10–16"],
              ["Adresa", "Knez Mihailova 21\nBeograd"],
              ["Kontakt", "+381 11 333 4455\nzdravo@museiris.rs"],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontSize: 10, letterSpacing: "0.3em", color: "var(--bronze)",
                    textTransform: "uppercase", marginBottom: 8,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)", fontSize: 16, color: "var(--parchment)",
                    whiteSpace: "pre-line", lineHeight: 1.5,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
