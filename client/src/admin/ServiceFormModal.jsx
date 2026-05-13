import { useEffect, useMemo, useState } from "react";
import * as api from "../api.js";
import { fmtRSD } from "../data/format.js";

// Naive but correct enough for Serbian Latin → kebab-case ASCII.
function slugify(input) {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "dj")
    .replace(/ć|č/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

const EMPTY = {
  id: "",
  category: "Manikir",
  name: "",
  description: "",
  duration: 30,
  price: 1000,
  featured: false,
  archived: false,
  sortOrder: 0,
};

export default function ServiceFormModal({ service, categories, onClose, onSaved }) {
  const isNew = !service;
  const [form, setForm] = useState(() => ({ ...EMPTY, ...service }));
  const [idEdited, setIdEdited] = useState(!isNew);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(null); // error string from 409

  useEffect(() => {
    // Auto-suggest id from name while creating, unless the user has edited the id field.
    if (!isNew || idEdited) return;
    setForm((f) => ({ ...f, id: slugify(f.name) }));
  }, [form.name, isNew, idEdited]);

  const set = (key) => (e) => {
    const value =
      e.target.type === "checkbox"
        ? e.target.checked
        : e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function handleSave(e) {
    e?.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        id: form.id,
        category: form.category,
        name: form.name.trim(),
        description: form.description.trim(),
        duration: form.duration,
        price: form.price,
        featured: !!form.featured,
        archived: !!form.archived,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (isNew) {
        await api.createService(payload);
      } else {
        // Don't send id on PATCH (immutable server-side).
        const { id, ...edits } = payload;
        await api.updateService(service.id, edits);
      }
      onSaved?.();
    } catch (err) {
      setError(err.message || "Greška pri čuvanju.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Trajno obrisati ovu uslugu? Ova akcija se ne može poništiti.")) return;
    setDeleteBlocked(null);
    setDeleting(true);
    try {
      await api.deleteService(service.id);
      onSaved?.();
    } catch (err) {
      if (err.status === 409) {
        setDeleteBlocked(err.message);
      } else {
        setError(err.message || "Greška pri brisanju.");
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleArchiveInstead() {
    setError(null);
    setSaving(true);
    try {
      await api.updateService(service.id, { archived: true });
      onSaved?.();
    } catch (err) {
      setError(err.message || "Greška pri arhiviranju.");
    } finally {
      setSaving(false);
    }
  }

  const pricePreview = useMemo(
    () => (Number.isFinite(form.price) ? fmtRSD(form.price) : "—"),
    [form.price]
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
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
            <span className="eyebrow">{isNew ? "Nova usluga" : "Izmena usluge"}</span>
            <h2 className="h-display" style={{ fontSize: 24, margin: "6px 0 4px" }}>
              {form.name || (isNew ? "—" : service.name)}
            </h2>
            <p style={{ color: "var(--parchment-dim)", fontSize: 13, margin: 0 }}>
              {form.category} · {form.duration} min · {pricePreview}
            </p>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            padding: "20px 26px",
          }}
        >
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Naziv *</label>
            <input
              className="input"
              value={form.name}
              onChange={set("name")}
              placeholder="npr. Klasični manikir"
              required
            />
          </div>
          <div className="field">
            <label>ID {isNew ? "*" : "(nepromenljivo)"}</label>
            <input
              className="input"
              value={form.id}
              onChange={(e) => {
                setIdEdited(true);
                setForm((f) => ({ ...f, id: e.target.value }));
              }}
              placeholder="mani-kl"
              disabled={!isNew}
              required
            />
          </div>
          <div className="field">
            <label>Kategorija *</label>
            <select className="select input" value={form.category} onChange={set("category")}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Opis</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={set("description")}
              placeholder="Kratki opis koji vide klijenti…"
              style={{ minHeight: 72, padding: "14px 16px 16px", lineHeight: 1.5 }}
            />
          </div>
          <div className="field">
            <label>Trajanje (min) *</label>
            <input
              className="input"
              type="number"
              min="1"
              step="5"
              value={form.duration}
              onChange={set("duration")}
              required
            />
          </div>
          <div className="field">
            <label>Cena (RSD) *</label>
            <input
              className="input"
              type="number"
              min="0"
              step="50"
              value={form.price}
              onChange={set("price")}
              required
            />
          </div>
          <div className="field">
            <label>Redosled</label>
            <input
              className="input"
              type="number"
              step="10"
              value={form.sortOrder}
              onChange={set("sortOrder")}
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
              checked={!!form.featured}
              onChange={set("featured")}
              style={{ accentColor: "#a87842" }}
            />
            Preporuka (istakni u listi)
          </label>
          <label
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--parchment-dim)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!form.archived}
              onChange={set("archived")}
              style={{ accentColor: "#a87842" }}
            />
            Arhivirano (skriveno od klijenata)
          </label>
        </div>

        {(error || deleteBlocked) && (
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
            {error || deleteBlocked}
            {deleteBlocked && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={handleArchiveInstead}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "var(--gold)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    padding: 0,
                  }}
                >
                  Arhiviraj umesto toga
                </button>
              </>
            )}
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
