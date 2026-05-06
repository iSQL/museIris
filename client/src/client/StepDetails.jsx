import StepHeading from "./StepHeading.jsx";

export default function StepDetails({ form, setForm }) {
  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  return (
    <div>
      <StepHeading
        eyebrow="Korak 04"
        title="Vaši podaci"
        sub="Slati ćemo vam potvrdu i podsetnik na ove kontakte."
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 720 }}>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Ime i prezime *</label>
          <input
            className="input"
            placeholder="npr. Milica Petrović"
            value={form.name}
            onChange={set("name")}
          />
        </div>
        <div className="field">
          <label>Telefon *</label>
          <input
            className="input"
            placeholder="+381 6_ ___ ____"
            value={form.phone}
            onChange={set("phone")}
          />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input
            className="input"
            type="email"
            placeholder="opciono"
            value={form.email}
            onChange={set("email")}
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Napomena za majstora</label>
          <textarea
            className="textarea"
            placeholder="Boja po izboru, alergije, posebne želje…"
            value={form.note}
            onChange={set("note")}
          />
        </div>
        <label
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            fontSize: 13,
            color: "var(--parchment-dim)",
            cursor: "pointer",
            marginTop: 6,
          }}
        >
          <input
            type="checkbox"
            checked={form.consent}
            onChange={set("consent")}
            style={{ marginTop: 3, accentColor: "#a87842" }}
          />
          <span>
            Slažem se da Muse Iris atelje koristi moje kontakt podatke isključivo u svrhu
            zakazivanja i podsetnika.
          </span>
        </label>
      </div>
    </div>
  );
}
