import BrandMark from "../components/BrandMark.jsx";

export default function AdminSidebar({ view, setView, counts, onLogout }) {
  const items = [
    { id: "overview", label: "Pregled" },
    { id: "requests", label: "Zahtevi", badge: counts.pending },
    { id: "calendar", label: "Kalendar" },
    { id: "clients", label: "Klijenti" },
    { id: "services", label: "Usluge" },
    { id: "settings", label: "Podešavanja" },
  ];

  return (
    <aside
      style={{
        borderRight: "1px solid var(--line-soft)",
        padding: "32px 24px",
        background: "linear-gradient(180deg, #0f0b0a, #0a0809)",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <BrandMark size={40} withName tagline="admin" />
      <nav style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            data-active={view === it.id}
            className="nav-item"
          >
            <span>{it.label}</span>
            {!!it.badge && (
              <span className="chip chip-burg" style={{ padding: "2px 8px" }}>
                {it.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
        <div
          style={{
            padding: 14,
            border: "1px solid var(--line-soft)",
            borderRadius: 2,
            background: "rgba(168,120,66,0.05)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              color: "var(--gold)",
              fontSize: 16,
              marginBottom: 4,
            }}
          >
            Milena M.
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>master · vlasnik</div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                marginTop: 12,
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--muted)",
                transition: "color .2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              Odjavi se →
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
