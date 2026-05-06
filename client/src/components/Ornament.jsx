export default function Ornament({ width = 80, color = "var(--bronze-deep)" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{ width, height: 1, background: color, opacity: 0.5 }} />
      <div
        style={{
          width: 6,
          height: 6,
          transform: "rotate(45deg)",
          background: color,
          opacity: 0.7,
        }}
      />
      <div style={{ width, height: 1, background: color, opacity: 0.5 }} />
    </div>
  );
}
