export default function StepHeading({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="h-display" style={{ fontSize: 36, margin: "8px 0 10px" }}>{title}</h2>
      {sub && <p style={{ color: "var(--parchment-dim)", margin: 0, fontSize: 14 }}>{sub}</p>}
    </div>
  );
}
