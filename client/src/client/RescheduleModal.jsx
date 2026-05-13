import { useEffect, useState } from "react";
import * as api from "../api.js";
import { isoDate, fmtDateLong, fmtDur } from "../data/format.js";
import MonthCalendar from "../components/MonthCalendar.jsx";

// Reschedule flow: pick a date, then pick a time, then confirm.
// Reuses MonthCalendar + the .time-pill style from the booking flow.
export default function RescheduleModal({ booking, services, workingHours, onClose, onSaved }) {
  const service = services.find((s) => s.id === booking.service);
  const [date, setDate] = useState(() => new Date(`${booking.date}T00:00:00`));
  const [time, setTime] = useState(booking.time);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + 60);

  useEffect(() => {
    if (!date || !service) return;
    const iso = isoDate(date);
    setLoading(true);
    setError(null);
    api
      .getAvailability(iso, service.id, booking.id)
      .then((res) => setSlots(res.slots))
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  }, [date, service, booking.id]);

  // If we land on a different date, default the selected time to the first
  // available slot for that day (or keep current if it's still available).
  useEffect(() => {
    if (!slots.length) return;
    const stillThere = slots.find((s) => s.time === time && !s.taken && !s.past);
    if (stillThere) return;
    const firstFree = slots.find((s) => !s.taken && !s.past);
    setTime(firstFree?.time || null);
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!time) return;
    setSaving(true);
    setError(null);
    try {
      await api.patchBookingByToken(booking.accessToken, {
        date: isoDate(date),
        time,
      });
      onSaved?.();
    } catch (err) {
      setError(err.message || "Greška pri promeni termina.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "22px 26px 0",
          }}
        >
          <div>
            <span className="eyebrow">Promena termina</span>
            <h2 className="h-display" style={{ fontSize: 24, margin: "6px 0 2px" }}>
              {service?.name}
            </h2>
            <p style={{ color: "var(--parchment-dim)", fontSize: 13, margin: 0 }}>
              {fmtDur(service?.duration)} · trenutno {fmtDateLong(new Date(`${booking.date}T00:00:00`))} u {booking.time}
            </p>
          </div>
          <button
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
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 24,
            padding: "20px 26px 26px",
          }}
        >
          <div>
            <MonthCalendar
              value={date}
              onChange={(d) => setDate(d)}
              minDate={today}
              maxDate={max}
              workingHours={workingHours}
            />
          </div>

          <div>
            <div className="divider" style={{ marginBottom: 14 }}>Dostupno</div>
            {loading && (
              <p style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                Učitavanje termina…
              </p>
            )}
            {!loading && slots.length === 0 && (
              <p style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                Tog dana ne radimo. Odaberite drugi datum.
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                gap: 8,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {slots.map((s) => {
                const disabled = s.taken || s.past;
                const isSel = time === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    className="time-pill"
                    disabled={disabled}
                    data-selected={isSel}
                    onClick={() => setTime(s.time)}
                  >
                    {s.time}
                    {s.taken && <span className="time-sub">zauzeto</span>}
                    {s.past && !s.taken && <span className="time-sub">prošlo</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              margin: "0 26px 12px",
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
          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
            Potvrđeni termini će se vratiti na <span style={{ color: "var(--gold)" }}>čekanje</span>{" "}
            dok Milena ne potvrdi novi termin.
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Odustani
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !time}>
              {saving ? "Čuvanje…" : "Potvrdi promenu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
