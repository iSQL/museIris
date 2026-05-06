import { Fragment } from "react";

export default function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
                  border: `1px solid ${active || done ? "var(--bronze)" : "var(--line)"}`,
                  background: done ? "var(--bronze-deep)" : "transparent",
                  color: done ? "var(--ink)" : (active ? "var(--gold)" : "var(--muted)"),
                  transition: "all .25s ease",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
                  color: active ? "var(--gold)" : (done ? "var(--parchment-dim)" : "var(--muted-2)"),
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1, height: 1, margin: "0 16px",
                  background: done
                    ? "var(--bronze-deep)"
                    : "linear-gradient(90deg, var(--line), var(--line-soft))",
                  minWidth: 24,
                }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
