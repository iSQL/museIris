import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api.js";
import {
  fmtDateLong,
  fmtDateShort,
  fmtDur,
  fmtRSD,
} from "../data/format.js";
import BrandMark from "../components/BrandMark.jsx";
import Ornament from "../components/Ornament.jsx";
import StatusChip from "../components/StatusChip.jsx";
import ClientFooter from "./ClientFooter.jsx";
import RescheduleModal from "./RescheduleModal.jsx";
import { listEntries, removeEntry, pruneStale } from "../lib/myBookings.js";

const POLL_MS = 30_000;
const EDIT_WINDOW_MIN = 4 * 60;

function withinEditWindow(b) {
  const target = new Date(`${b.date}T${b.time}:00`);
  return (target.getTime() - Date.now()) / 60_000 > EDIT_WINDOW_MIN;
}

export default function MyBookingsPage() {
  const [services, setServices] = useState([]);
  const [workingHours, setWorkingHours] = useState({});
  const [bookings, setBookings] = useState([]); // [{ booking, error? }]
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  // Track in-flight requests to avoid step-on-toes when polling races with user action.
  const inflight = useRef(0);

  const refresh = useCallback(async () => {
    const entries = listEntries();
    if (entries.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const reqId = ++inflight.current;
    const results = await Promise.all(
      entries.map((e) =>
        api
          .getBookingByToken(e.accessToken)
          .then((res) => ({ id: e.id, booking: res.booking }))
          .catch((err) => ({ id: e.id, error: err }))
      )
    );
    if (reqId !== inflight.current) return; // a newer refresh has started

    // Prune entries the server says are gone (404).
    const map = new Map(
      results.map((r) =>
        r.booking ? [r.id, r.booking] : r.error?.status === 404 ? [r.id, null] : [r.id, undefined]
      )
    );
    pruneStale(map);

    const final = results
      .filter((r) => !(r.error && r.error.status === 404))
      .map((r) =>
        r.booking
          ? { booking: r.booking, error: null }
          : { booking: null, error: r.error, _entry: entries.find((e) => e.id === r.id) }
      )
      .sort((a, b) => {
        const ad = a.booking ? `${a.booking.date} ${a.booking.time}` : "";
        const bd = b.booking ? `${b.booking.date} ${b.booking.time}` : "";
        return bd.localeCompare(ad);
      });
    setBookings(final);
    setLoading(false);
  }, []);

  useEffect(() => {
    api.getServices().then((res) => setServices(res.services)).catch(() => {});
    api.getWorkingHours().then((res) => setWorkingHours(res.workingHours)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const entries = listEntries();

  if (loading && entries.length > 0) {
    return (
      <PageShell>
        <p style={{ color: "var(--muted)", fontFamily: "var(--serif)", fontStyle: "italic", textAlign: "center" }}>
          Učitavanje vaših termina…
        </p>
      </PageShell>
    );
  }

  if (entries.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  return (
    <>
      <PageShell>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bookings.map(({ booking, error, _entry }) =>
            booking ? (
              <BookingRow
                key={booking.id}
                booking={booking}
                services={services}
                onReschedule={() => setRescheduleTarget(booking)}
                onChanged={refresh}
              />
            ) : (
              <ErrorRow key={_entry?.id || Math.random()} entry={_entry} error={error} onForget={refresh} />
            )
          )}
        </div>
      </PageShell>

      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          services={services}
          workingHours={workingHours}
          onClose={() => setRescheduleTarget(null)}
          onSaved={() => {
            setRescheduleTarget(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
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
            maxWidth: 980,
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

      <section
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "60px 32px 30px",
          textAlign: "center",
        }}
      >
        <span className="eyebrow">Vaš nalog</span>
        <h1 className="h-display" style={{ fontSize: 64, margin: "14px 0 18px" }}>
          Moji <em style={{ fontStyle: "italic", color: "var(--gold)" }}>termini</em>
        </h1>
        <Ornament width={70} />
      </section>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "10px 32px 0" }}>
        {children}
      </section>

      <ClientFooter />
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <p
        style={{
          color: "var(--parchment-dim)",
          maxWidth: 480,
          margin: "0 auto 28px",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        Još uvek nemate zakazane termine sa ovog uređaja.
        Kada zakažete termin, ovde ćete moći da ga vidite, izmenite ili otkažete.
      </p>
      <Link to="/" className="btn btn-primary">
        Zakaži termin
      </Link>
    </div>
  );
}

function BookingRow({ booking, services, onReschedule, onChanged }) {
  const svc = services.find((s) => s.id === booking.service);
  const [note, setNote] = useState(booking.note || "");
  const [noteDirty, setNoteDirty] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  const editable =
    (booking.status === "pending" || booking.status === "approved") &&
    withinEditWindow(booking);

  // Reset local note when the server-side value changes underneath us (e.g. polling).
  useEffect(() => {
    if (!noteDirty) setNote(booking.note || "");
  }, [booking.note, noteDirty]);

  async function saveNote() {
    if (!noteDirty) return;
    if ((booking.note || "") === note) {
      setNoteDirty(false);
      return;
    }
    setSavingNote(true);
    setError(null);
    try {
      await api.patchBookingByToken(booking.accessToken, { note });
      setNoteDirty(false);
      onChanged?.();
    } catch (err) {
      setError(err.message || "Greška pri čuvanju napomene.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Otkazati ovaj termin? Ova akcija se ne može poništiti.")) return;
    setCancelling(true);
    setError(null);
    try {
      await api.cancelBookingByToken(booking.accessToken);
      onChanged?.();
    } catch (err) {
      setError(err.message || "Greška pri otkazivanju.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--bronze)", fontSize: 14 }}>
              {booking.id}
            </span>
            <StatusChip status={booking.status} />
          </div>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500, margin: "8px 0 4px", color: "var(--parchment)" }}>
            {svc?.name || booking.service}
          </h3>
          <div style={{ fontSize: 14, color: "var(--parchment-dim)" }}>
            {fmtDateLong(new Date(`${booking.date}T00:00:00`))}
          </div>
          <div style={{ color: "var(--gold)", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, marginTop: 4 }}>
            {booking.time} · {fmtDur(svc?.duration || 0)} · {fmtRSD(svc?.price || 0)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
          {editable && (
            <>
              <button className="btn btn-ghost" onClick={onReschedule} style={{ padding: "10px 16px" }}>
                Promeni termin
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleCancel}
                disabled={cancelling}
                style={{ padding: "10px 16px", borderColor: "var(--bad)", color: "#d99a8b" }}
              >
                {cancelling ? "Otkazivanje…" : "Otkaži termin"}
              </button>
            </>
          )}
          {!editable && booking.status !== "completed" && booking.status !== "rejected" && booking.status !== "canceled" && (
            <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)", textAlign: "right", maxWidth: 200 }}>
              Manje od 4h do termina — promene su moguće samo telefonom.
            </span>
          )}
          {booking.status === "completed" && (
            <span style={{ fontSize: 12, color: "var(--gold)", fontStyle: "italic", fontFamily: "var(--serif)", textAlign: "right" }}>
              Termin je obavljen. Hvala!
            </span>
          )}
          {booking.status === "canceled" && (
            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)", textAlign: "right" }}>
              Termin je otkazan.
            </span>
          )}
          {booking.status === "rejected" && (
            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--serif)", textAlign: "right" }}>
              Termin je odbijen.
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            border: "1px solid var(--bad)",
            borderRadius: 2,
            color: "#d99a8b",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--line-soft)" }}>
        <label
          style={{
            display: "block",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 6,
          }}
        >
          Napomena
        </label>
        <textarea
          className="textarea"
          value={note}
          disabled={!editable}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteDirty(true);
          }}
          onBlur={saveNote}
          placeholder={editable ? "Dodajte ili izmenite napomenu…" : "—"}
          style={{ minHeight: 96, padding: "14px 16px 18px", lineHeight: 1.5 }}
        />
        {savingNote && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontStyle: "italic" }}>
            Čuvanje…
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorRow({ entry, error, onForget }) {
  function forget() {
    if (entry?.id) removeEntry(entry.id);
    onForget?.();
  }
  return (
    <div
      className="card"
      style={{
        padding: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ color: "var(--parchment)", marginBottom: 4 }}>
          {entry?.id || "Nepoznat termin"}
        </div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          {error?.message || "Termin se ne može učitati."}
        </div>
      </div>
      <button className="btn btn-ghost" onClick={forget} style={{ padding: "10px 16px" }}>
        Ukloni iz liste
      </button>
    </div>
  );
}
