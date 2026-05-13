import { Fragment } from "react";

export default function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <Fragment key={i}>
            <div className="stepper-item">
              <div
                className="stepper-dot"
                data-active={active}
                data-done={done}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className="stepper-label"
                data-active={active}
                data-done={done}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="stepper-line" data-done={done} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
