export default function IrisAtmosphere({ style }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        background: "radial-gradient(ellipse 70% 100% at 60% 35%, #2a0a13 0%, #0a0506 70%)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 28% 38% at 62% 42%, rgba(165,35,56,0.55), transparent 70%),
            radial-gradient(ellipse 18% 26% at 70% 32%, rgba(220,80,100,0.35), transparent 65%),
            radial-gradient(ellipse 24% 30% at 55% 55%, rgba(70,15,28,0.65), transparent 70%),
            radial-gradient(ellipse 8% 12% at 64% 48%, rgba(255,200,140,0.3), transparent 70%)
          `,
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6))",
        }}
      />
    </div>
  );
}
