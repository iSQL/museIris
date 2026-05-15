import { useEffect, useState } from "react";
import * as api from "../api.js";
import { fmtRSD } from "../data/format.js";
import StepHeading from "./StepHeading.jsx";

function describeDiscount(c) {
  if (!c) return "";
  if (c.discountPercent) return `${c.discountPercent}% popusta`;
  if (c.discountAmount) return `${fmtRSD(c.discountAmount)} popusta`;
  return "";
}

export default function StepDetails({ form, setForm, service, coupon, setCoupon }) {
  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const [couponInput, setCouponInput] = useState(coupon?.code || "");
  const [couponError, setCouponError] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Keep the input in sync if the coupon is set externally (e.g. via URL param).
  useEffect(() => {
    if (coupon?.code && coupon.code !== couponInput) setCouponInput(coupon.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon?.code]);

  async function applyCoupon(e) {
    e?.preventDefault();
    const code = (couponInput || "").trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    setCouponBusy(true);
    try {
      const res = await api.validateCoupon(code, service?.id);
      setCoupon({
        code: res.code,
        discount: res.discount || 0,
        discountPercent: res.discountPercent,
        discountAmount: res.discountAmount,
      });
      setCouponInput(res.code);
    } catch (err) {
      setCouponError(err.message || "Kupon nije važeći.");
      setCoupon(null);
    } finally {
      setCouponBusy(false);
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  const finalPrice = service
    ? Math.max(0, service.price - (coupon?.discount || 0))
    : null;

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

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Kupon (opciono)</label>
          {coupon ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                border: "1px solid var(--bronze-deep)",
                background: "rgba(168,120,66,0.08)",
                borderRadius: 2,
                flexWrap: "wrap",
              }}
            >
              <span className="chip chip-gold">{coupon.code}</span>
              <span style={{ color: "var(--parchment-dim)", fontSize: 13 }}>
                {describeDiscount(coupon)}
                {service && coupon.discount > 0 && (
                  <>
                    {" "}— ušteda <strong style={{ color: "var(--gold)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                      {fmtRSD(coupon.discount)}
                    </strong>
                  </>
                )}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearCoupon}
                style={{ marginLeft: "auto", padding: "8px 14px", fontSize: 10 }}
              >
                Ukloni
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="npr. PROLECE25"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyCoupon(e);
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={applyCoupon}
                disabled={couponBusy || !couponInput.trim()}
                style={{ padding: "10px 18px", whiteSpace: "nowrap" }}
              >
                {couponBusy ? "Provera…" : "Primeni"}
              </button>
            </div>
          )}
          {couponError && (
            <span style={{ fontSize: 12, color: "#d99a8b" }}>{couponError}</span>
          )}
          {coupon && service && finalPrice !== null && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Cena posle popusta:{" "}
              <strong style={{ color: "var(--gold)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {fmtRSD(finalPrice)}
              </strong>
            </span>
          )}
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
