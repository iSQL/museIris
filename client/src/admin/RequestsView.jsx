import { fmtRSD, fmtDur, fmtDateLong, fmtDateShort, fmtRelativeTime } from "../data/format.js";
import StatusChip from "../components/StatusChip.jsx";

function DetailRow({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr",
        gap: 14,
        padding: "8px 0",
        borderBottom: "1px dashed var(--line-soft)",
        fontSize: 13,
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted-2)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: highlight ? "var(--serif)" : "inherit",
          fontStyle: highlight ? "italic" : "normal",
          color: highlight ? "var(--gold)" : "var(--parchment)",
          fontSize: highlight ? 16 : 13,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function RequestDetail({ services, booking, setStatus, onClose }) {
  const svc = services.find((s) => s.id === booking.service);
  return (
    <aside className="card" style={{ padding: 28, position: "sticky", top: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <span className="eyebrow">Detalji zahteva</span>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 24,
              color: "var(--gold)",
              marginTop: 6,
            }}
          >
            {booking.id}
          </div>
        </div>
        <button
          onClick={onClose}
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

      <StatusChip status={booking.status} />

      <h3
        style={{
          fontFamily: "var(--serif)",
          fontSize: 22,
          marginTop: 20,
          marginBottom: 4,
          color: "var(--parchment)",
        }}
      >
        {booking.client.name}
      </h3>
      <div style={{ fontSize: 13, color: "var(--parchment-dim)", marginBottom: 24 }}>
        <div>{booking.client.phone}</div>
        {booking.client.email && <div>{booking.client.email}</div>}
      </div>

      <div className="gold-rule" style={{ margin: "0 0 18px" }} />

      <DetailRow label="Usluga" value={svc?.name} />
      <DetailRow label="Trajanje" value={fmtDur(svc?.duration)} />
      <DetailRow label="Cena" value={fmtRSD(svc?.price || 0)} highlight />
      <DetailRow label="Datum" value={fmtDateLong(new Date(booking.date))} />
      <DetailRow label="Vreme" value={booking.time} highlight />
      <DetailRow label="Poslato" value={fmtRelativeTime(booking.created)} />

      {booking.note && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: "rgba(168,120,66,0.06)",
            border: "1px solid var(--line-soft)",
            borderRadius: 2,
          }}
        >
          <span className="eyebrow" style={{ fontSize: 9 }}>
            Napomena klijenta
          </span>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "var(--parchment-dim)",
              lineHeight: 1.55,
              fontStyle: "italic",
              fontFamily: "var(--serif)",
            }}
          >
            „{booking.note}"
          </p>
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {booking.status === "pending" && (
          <>
            <button className="btn btn-primary" onClick={() => setStatus(booking.id, "approved")}>
              Potvrdi termin
            </button>
            <button className="btn btn-ghost" onClick={() => setStatus(booking.id, "rejected")}>
              Odbij
            </button>
          </>
        )}
        {booking.status === "approved" && (
          <>
            <button className="btn btn-gold" onClick={() => setStatus(booking.id, "completed")}>
              Označi obavljenim
            </button>
            <button className="btn btn-ghost" onClick={() => setStatus(booking.id, "rejected")}>
              Otkaži
            </button>
          </>
        )}
        {booking.status === "rejected" && (
          <button className="btn btn-ghost" onClick={() => setStatus(booking.id, "pending")}>
            Vrati na čekanje
          </button>
        )}
        {booking.status === "completed" && (
          <span
            style={{
              color: "var(--muted)",
              fontStyle: "italic",
              fontFamily: "var(--serif)",
              textAlign: "center",
              fontSize: 13,
            }}
          >
            Termin je arhiviran.
          </span>
        )}
      </div>
    </aside>
  );
}

export default function RequestsView({
  services,
  bookings,
  filter,
  setFilter,
  counts,
  setStatus,
  selected,
  setSelected,
  search,
  setSearch,
}) {
  const filters = [
    { id: "all", label: "Sve", count: bookings.length },
    { id: "pending", label: "Na čekanju", count: counts.pending },
    { id: "approved", label: "Potvrđeno", count: counts.approved },
    { id: "completed", label: "Obavljeno", count: counts.completed },
    { id: "rejected", label: "Odbijeno", count: counts.rejected },
  ];

  const list = bookings
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.client.name.toLowerCase().includes(q) ||
        b.client.phone.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: selected ? "minmax(0,1fr) 380px" : "1fr",
        gap: 24,
        alignItems: "start",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              background: "var(--ink-2)",
              border: "1px solid var(--line-soft)",
              borderRadius: 999,
            }}
          >
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                data-active={filter === f.id}
                className="filter-pill"
              >
                {f.label}
                <span style={{ opacity: 0.6, marginLeft: 6 }}>{f.count}</span>
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Pretraži po imenu, broju ili ID-u…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="req-row req-head">
            <span>ID</span>
            <span>Klijent</span>
            <span>Usluga</span>
            <span>Datum / vreme</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>
          {list.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--muted)",
                fontStyle: "italic",
                fontFamily: "var(--serif)",
              }}
            >
              Nema zahteva u ovoj kategoriji.
            </div>
          )}
          {list.map((b) => {
            const svc = services.find((s) => s.id === b.service);
            const isSel = selected?.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="req-row req-item"
                data-active={isSel}
              >
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--bronze)" }}>
                  {b.id}
                </span>
                <span>
                  <div style={{ color: "var(--parchment)" }}>{b.client.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.client.phone}</div>
                </span>
                <span>
                  <div style={{ color: "var(--parchment-dim)" }}>{svc?.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {fmtDur(svc?.duration)} · {fmtRSD(svc?.price || 0)}
                  </div>
                </span>
                <span>
                  <div style={{ fontFamily: "var(--serif)", color: "var(--parchment)" }}>
                    {fmtDateShort(new Date(b.date))}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--gold)",
                      fontStyle: "italic",
                      fontFamily: "var(--serif)",
                    }}
                  >
                    {b.time}
                  </div>
                </span>
                <span style={{ textAlign: "right" }}>
                  <StatusChip status={b.status} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <RequestDetail
          services={services}
          booking={selected}
          setStatus={setStatus}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
