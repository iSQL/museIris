import { useState } from "react";
import * as api from "../api.js";
import BrandMark from "../components/BrandMark.jsx";
import Ornament from "../components/Ornament.jsx";

export default function Login({ onAuthed }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.login(password);
      onAuthed?.();
    } catch (err) {
      setError(err.message || "Greška pri prijavi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        background: "linear-gradient(180deg, #0a0506 0%, #0a0809 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 40% 50% at 70% 25%, rgba(139,26,43,0.30), transparent 60%),
            radial-gradient(ellipse 30% 40% at 25% 80%, rgba(90,19,32,0.4), transparent 65%)
          `,
          pointerEvents: "none",
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          position: "relative",
          padding: "40px 44px",
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <BrandMark size={56} withName tagline="admin" />
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <span className="eyebrow">Kontrolna tabla</span>
          <h1 className="h-display" style={{ fontSize: 32, margin: "8px 0 6px" }}>
            Dobrodošli,{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Milena</em>
          </h1>
          <Ornament width={48} />
        </div>

        <div className="field" style={{ width: "100%", marginTop: 6 }}>
          <label htmlFor="pw">Lozinka</label>
          <input
            id="pw"
            type="password"
            className="input"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="• • • • • • • •"
          />
        </div>

        {error && (
          <div
            style={{
              alignSelf: "stretch",
              padding: "10px 14px",
              border: "1px solid var(--bad)",
              borderRadius: 2,
              color: "#d99a8b",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !password}
          style={{ alignSelf: "stretch", marginTop: 4 }}
        >
          {submitting ? "Prijavljivanje…" : "Prijavi se"}
        </button>
      </form>
    </div>
  );
}
