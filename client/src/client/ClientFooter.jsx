import BrandMark from "../components/BrandMark.jsx";

export default function ClientFooter() {
  return (
    <footer
      style={{
        marginTop: 80,
        padding: "50px 32px 30px",
        borderTop: "1px solid var(--line-soft)",
        background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <BrandMark size={44} withName tagline="atelier" />
        <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
          <div>Knez Ulica bb, Žabari</div>
          <div>+381 12 ??? ????· museiris@gmail.com</div>
          <div style={{ marginTop: 8, fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--bronze)" }}>
            © 2026 Muse Iris atelier
          </div>
        </div>
      </div>
    </footer>
  );
}
