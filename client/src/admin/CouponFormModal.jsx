import { useMemo, useState } from "react";
import * as api from "../api.js";
import { fmtRSD } from "../data/format.js";

// Normalize to upper-case + strip disallowed chars while typing.
function normalize(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

function isoToInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CouponFormModal({ coupon, onClose, onSaved }) {
  const isNew = !coupon;
  const [code, setCode] = useState(coupon?.code || "");
  const [discountType, setDiscountType] = useState(
    coupon?.discountAmount ? "amount" : "percent"
  );
  const [discountPercent, setDiscountPercent] = useState(coupon?.discountPercent ?? 10);
  const [discountAmount, setDiscountAmount] = useState(coupon?.discountAmount ?? 500);
  const [maxActivations, setMaxActivations] = useState(coupon?.maxActivations ?? "");
  const [expiresAt, setExpiresAt] = useState(isoToInput(coupon?.expiresAt));
  const [active, setActive] = useState(coupon?.active !== false);

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const shareUrl = useMemo(() => {
    if (!code) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/?coupon=${encodeURIComponent(code)}`;
  }, [code]);

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore – user can copy from the field manually */
    }
  }

  async function handleSave(e) {
    e?.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Kod je obavezan.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.trim(),
        discountPercent: discountType === "percent" ? Number(discountPercent) : null,
        discountAmount: discountType === "amount" ? Number(discountAmount) : null,
        maxActivations: maxActivations === "" ? null : Number(maxActivations),
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        active,
      };
      if (isNew) {
        await api.createCoupon(payload);
      } else {
        const { code: _ignored, ...edits } = payload;
        await api.updateCoupon(coupon.id, edits);
      }
      onSaved?.();
    } catch (err) {
      setError(err.message || "Greška pri čuvanju.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Trajno obrisati ovaj kupon?")) return;
    setError(null);
    setDeleting(true);
    try {
      await api.deleteCoupon(coupon.id);
      onSaved?.();
    } catch (err) {
      setError(err.message || "Greška pri brisanju.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{ maxWidth: 620 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "22px 26px 0",
            gap: 16,
          }}
        >
          <div>
            <span className="eyebrow">{isNew ? "Novi kupon" : "Izmena kupona"}</span>
            <h2 className="h-display" style={{ fontSize: 24, margin: "6px 0 4px" }}>
              {code || "—"}
            </h2>
            {!isNew && (
              <p style={{ color: "var(--parchment-dim)", fontSize: 13, margin: 0 }}>
                Iskorišćeno: {coupon.activationsUsed}
                {coupon.maxActivations != null ? ` / ${coupon.maxActivations}` : " / ∞"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori"
            style={{
              background: "transparent",
              border: "1px solid var(--line)",
              color: "var(--muted)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "20px 26px" }}>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Kod {isNew ? "*" : "(nepromenljivo)"}</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(normalize(e.target.value))}
              placeholder="npr. PROLECE25"
              disabled={!isNew}
              required
            />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              3–32 znaka. Velika slova, brojevi, '-' i '_'.
            </span>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Tip popusta *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className="filter-pill"
                data-active={discountType === "percent"}
                disabled={!isNew}
                style={{ padding: "10px 18px" }}
              >
                Procenat (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("amount")}
                className="filter-pill"
                data-active={discountType === "amount"}
                disabled={!isNew}
                style={{ padding: "10px 18px" }}
              >
                Fiksno (RSD)
              </button>
            </div>
            {!isNew && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Tip se ne menja nakon kreiranja.
              </span>
            )}
          </div>

          {discountType === "percent" ? (
            <div className="field">
              <label>Popust (%) *</label>
              <input
                className="input"
                type="number"
                min="1"
                max="100"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="field">
              <label>Popust (RSD) *</label>
              <input
                className="input"
                type="number"
                min="1"
                step="50"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                required
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {Number(discountAmount) ? fmtRSD(Number(discountAmount)) : "—"} popusta po terminu.
              </span>
            </div>
          )}

          <div className="field">
            <label>Maks. aktivacija</label>
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              value={maxActivations}
              onChange={(e) => setMaxActivations(e.target.value)}
              placeholder="prazno = neograničeno"
            />
          </div>

          <div className="field">
            <label>Ističe</label>
            <input
              className="input"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              placeholder="prazno = ne ističe"
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--parchment-dim)",
              cursor: "pointer",
              alignSelf: "end",
              paddingBottom: 14,
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ accentColor: "#a87842" }}
            />
            Aktivan
          </label>

          {shareUrl && (
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Link za deljenje (auto-primenjuje kupon)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={copyShareUrl}
                  style={{ padding: "10px 16px", whiteSpace: "nowrap" }}
                >
                  Kopiraj
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              margin: "0 26px 14px",
              padding: 12,
              border: "1px solid var(--bad)",
              borderRadius: 2,
              color: "#d99a8b",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: "16px 26px 22px",
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving || deleting}>
              Otkaži
            </button>
            {!isNew && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleDelete}
                disabled={saving || deleting}
                style={{ borderColor: "var(--bad)", color: "#d99a8b" }}
              >
                {deleting ? "Brisanje…" : "Obriši"}
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || deleting}>
            {saving ? "Čuvanje…" : "Sačuvaj"}
          </button>
        </div>
      </form>
    </div>
  );
}
