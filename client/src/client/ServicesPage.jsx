import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api.js";
import { fmtRSD, fmtDur } from "../data/format.js";
import BrandMark from "../components/BrandMark.jsx";
import Ornament from "../components/Ornament.jsx";
import ClientFooter from "./ClientFooter.jsx";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getServices()
      .then((res) => {
        setServices(res.services);
        setCategories(res.categories);
      })
      .catch((err) => setError(err.message || String(err)));
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* Slim header — atmospheric backdrop, smaller than ClientHero */}
      <header
        style={{
          position: "relative",
          padding: "40px 32px 0",
          background: "linear-gradient(180deg, #0a0506 0%, #0a0809 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 40% 60% at 85% 30%, rgba(139,26,43,0.25), transparent 60%),
              radial-gradient(ellipse 30% 50% at 15% 100%, rgba(90,19,32,0.35), transparent 65%)
            `,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <BrandMark size={48} withName tagline="atelier" />
          <Link to="/" className="btn btn-ghost" style={{ padding: "10px 18px" }}>
            ← Nazad na početnu
          </Link>
        </div>
      </header>

      {/* Page title block */}
      <section
        style={{
          position: "relative",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "70px 32px 30px",
          textAlign: "center",
        }}
      >
        <span className="eyebrow">Cenovnik · Žabari</span>
        <h1 className="h-display" style={{ fontSize: 72, margin: "14px 0 18px" }}>
          Usluge <em style={{ fontStyle: "italic", color: "var(--gold)" }}>ateljea</em>
        </h1>
        <Ornament width={70} />
        <p
          style={{
            marginTop: 22,
            color: "var(--parchment-dim)",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          Pažljivo birane tehnike i materijali, bez žurbe i bez kompromisa.
          Cene su konačne, a trajanje realno odraženo na zakazivanje.
        </p>
      </section>

      {/* Categories */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 32px 0" }}>
        {error && (
          <div
            style={{
              padding: 12,
              border: "1px solid var(--bad)",
              borderRadius: 2,
              color: "#d99a8b",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            Greška pri učitavanju: {error}
          </div>
        )}

        {categories.map((cat) => {
          const list = services.filter((s) => s.cat === cat);
          if (list.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 56 }}>
              <div className="divider" style={{ marginBottom: 24, fontSize: 20 }}>
                {cat}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {list.map((s) => (
                  <div key={s.id} className="svc-card" style={{ cursor: "default" }}>
                    {s.featured && (
                      <span
                        className="chip chip-gold"
                        style={{ position: "absolute", top: 14, right: 14 }}
                      >
                        Preporuka
                      </span>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 16,
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 22,
                          fontWeight: 500,
                          margin: 0,
                          color: "var(--parchment)",
                        }}
                      >
                        {s.name}
                      </h3>
                    </div>
                    <p
                      style={{
                        color: "var(--parchment-dim)",
                        margin: "8px 0 18px",
                        fontSize: 13,
                        lineHeight: 1.55,
                      }}
                    >
                      {s.desc}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 14,
                        borderTop: "1px dashed var(--line-soft)",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span
                          style={{
                            fontSize: 11,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "var(--muted)",
                          }}
                        >
                          {fmtDur(s.duration)}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--serif)",
                            fontSize: 22,
                            fontStyle: "italic",
                            color: "var(--bronze)",
                          }}
                        >
                          {fmtRSD(s.price)}
                        </span>
                      </div>
                      <Link
                        to={`/?service=${encodeURIComponent(s.id)}#booking`}
                        className="btn btn-primary"
                        style={{ padding: "10px 20px" }}
                      >
                        Zakaži
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <ClientFooter />
    </div>
  );
}
