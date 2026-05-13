import { useEffect, useMemo, useState } from "react";
import * as api from "../api.js";
import { DAYS_SR_LONG } from "../data/format.js";

const SLOT_OPTIONS = [15, 30, 45, 60];

// 0 = Sunday … 6 = Saturday. The salon week reads Mon → Sun in the UI.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function cloneConfig(c) {
  return c ? { ...c, workingHours: { ...c.workingHours } } : null;
}

export default function SettingsView({ guard }) {
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await guard(() => api.getConfig());
        if (!res) return;
        setOriginal(res.config);
        setDraft(cloneConfig(res.config));
      } catch (err) {
        setError(err.message || String(err));
      }
    })();
  }, [guard]);

  const dirty = useMemo(() => {
    if (!original || !draft) return false;
    return JSON.stringify(original) !== JSON.stringify(draft);
  }, [original, draft]);

  function setDay(dayKey, value) {
    setSaved(false);
    setDraft((d) => ({
      ...d,
      workingHours: { ...d.workingHours, [dayKey]: value },
    }));
  }

  function toggleClosed(dayKey, closed) {
    if (closed) setDay(dayKey, null);
    else setDay(dayKey, ["09:00", "17:00"]);
  }

  function updateTime(dayKey, idx, value) {
    setDraft((d) => {
      const cur = d.workingHours[dayKey];
      if (!cur) return d;
      const next = [...cur];
      next[idx] = value;
      return {
        ...d,
        workingHours: { ...d.workingHours, [dayKey]: next },
      };
    });
    setSaved(false);
  }

  function setSlotStep(v) {
    setSaved(false);
    setDraft((d) => ({ ...d, slotStep: v }));
  }

  function setLeadTime(v) {
    setSaved(false);
    setDraft((d) => ({ ...d, leadTimeMin: v }));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await guard(() =>
        api.updateConfig({
          workingHours: draft.workingHours,
          slotStep: draft.slotStep,
          leadTimeMin: draft.leadTimeMin,
        })
      );
      if (!res) return;
      setOriginal(res.config);
      setDraft(cloneConfig(res.config));
      setSaved(true);
    } catch (err) {
      setError(err.message || "Greška pri čuvanju.");
    } finally {
      setSaving(false);
    }
  }

  function handleRevert() {
    setDraft(cloneConfig(original));
    setError(null);
    setSaved(false);
  }

  if (!draft) {
    return (
      <p style={{ color: "var(--muted)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
        Učitavanje podešavanja…
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Radno vreme */}
      <div className="card" style={{ padding: 24 }}>
        <span className="eyebrow">Radno vreme</span>
        <h3 className="h-display" style={{ fontSize: 22, margin: "6px 0 18px" }}>
          Po danima u nedelji
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WEEK_ORDER.map((d) => {
            const key = String(d);
            const value = draft.workingHours[key];
            const closed = value === null || value === undefined;
            return (
              <div
                key={d}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 120px minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 14,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px dashed var(--line-soft)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 16,
                    color: "var(--parchment)",
                  }}
                >
                  {DAYS_SR_LONG[d]}
                </span>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--parchment-dim)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={(e) => toggleClosed(key, e.target.checked)}
                    style={{ accentColor: "#a87842" }}
                  />
                  Zatvoreno
                </label>
                <input
                  type="time"
                  className="input"
                  value={closed ? "" : value[0]}
                  disabled={closed}
                  onChange={(e) => updateTime(key, 0, e.target.value)}
                  style={{ padding: "10px 12px" }}
                />
                <input
                  type="time"
                  className="input"
                  value={closed ? "" : value[1]}
                  disabled={closed}
                  onChange={(e) => updateTime(key, 1, e.target.value)}
                  style={{ padding: "10px 12px" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot raster */}
      <div className="card" style={{ padding: 24 }}>
        <span className="eyebrow">Korak vremena (slot)</span>
        <h3 className="h-display" style={{ fontSize: 22, margin: "6px 0 14px" }}>
          Raster termina
        </h3>
        <p style={{ color: "var(--parchment-dim)", fontSize: 13, margin: "0 0 16px" }}>
          Određuje na koliko minuta klijent može da bira termin. Manji korak = više
          opcija, ali sitnije popunjavanje rasporeda.
        </p>
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            background: "var(--ink-2)",
            border: "1px solid var(--line-soft)",
            borderRadius: 999,
          }}
        >
          {SLOT_OPTIONS.map((v) => (
            <button
              key={v}
              onClick={() => setSlotStep(v)}
              data-active={draft.slotStep === v}
              className="filter-pill"
            >
              {v} min
            </button>
          ))}
        </div>
      </div>

      {/* Lead time */}
      <div className="card" style={{ padding: 24 }}>
        <span className="eyebrow">Zakazivanje unapred</span>
        <h3 className="h-display" style={{ fontSize: 22, margin: "6px 0 14px" }}>
          Minimalno vreme do termina
        </h3>
        <p style={{ color: "var(--parchment-dim)", fontSize: 13, margin: "0 0 16px" }}>
          Najmanji razmak između trenutka slanja zahteva i samog termina. 30
          minuta znači da klijent ne može da zakaže u narednih 30 min.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 240 }}>
          <input
            type="number"
            className="input"
            min="0"
            step="15"
            value={draft.leadTimeMin}
            onChange={(e) => setLeadTime(Number(e.target.value) || 0)}
          />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>min</span>
        </div>
      </div>

      {/* Status + actions */}
      {error && (
        <div
          style={{
            padding: 12,
            border: "1px solid var(--bad)",
            borderRadius: 2,
            color: "#d99a8b",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {saved && !error && (
        <div
          style={{
            padding: 12,
            border: "1px solid var(--ok)",
            borderRadius: 2,
            color: "#a3c595",
            fontSize: 13,
          }}
        >
          Sačuvano.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingTop: 4,
          position: "sticky",
          bottom: 0,
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={handleRevert}
          disabled={!dirty || saving}
        >
          Vrati
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "Čuvanje…" : "Sačuvaj izmene"}
        </button>
      </div>
    </div>
  );
}
