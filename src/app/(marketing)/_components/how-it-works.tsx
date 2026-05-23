import type { LandingCopy } from "@/lib/i18n/landing";

import { StepVisualPitch, StepVisualQualify, StepVisualScan } from "./product-mocks";

function StepVisual({ index, copy }: { index: number; copy: LandingCopy }) {
  if (index === 0) return <StepVisualScan />;
  if (index === 1) return <StepVisualQualify />;
  return <StepVisualPitch copy={copy} />;
}

export function HowItWorks({ copy }: { copy: LandingCopy }) {
  return (
    <section id="how" className="dark-section">
      <div className="radar-grid" aria-hidden="true" />
      <div className="container" style={{ position: "relative" }}>
        <div style={{ maxWidth: 720 }}>
          <span className="eyebrow">{copy.how.eyebrow}</span>
          <h2 className="h1" style={{ marginTop: 12, color: "#fff" }}>
            {copy.how.title}
          </h2>
        </div>
        <div className="how-steps">
          {copy.how.steps.map((step, index) => (
              <div className="step" key={step.title}>
                <div className="step-num">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <div className="step-visual">
                  <StepVisual index={index} copy={copy} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
