import { Check, X } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

export function BeforeAfter({ copy }: { copy: LandingCopy }) {
  return (
    <section style={{ background: "#fff" }}>
      <div className="container">
        <div style={{ maxWidth: 720 }}>
          <span className="eyebrow">{copy.beforeAfter.eyebrow}</span>
          <h2 className="h1" style={{ marginTop: 12 }}>
            {copy.beforeAfter.title}
          </h2>
          <p className="body-lg" style={{ marginTop: 18, maxWidth: 580 }}>
            {copy.beforeAfter.intro}
          </p>
        </div>

        <div className="before-after">
          <div className="ba-card bad">
            <div className="ba-label">{copy.beforeAfter.badLabel}</div>
            <h3>{copy.beforeAfter.badTitle}</h3>
            <ul className="ba-list">
              {copy.beforeAfter.badItems.map((item) => (
                <li key={item}>
                  <span className="mark">
                    <X size={14} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="ba-card good">
            <div className="ba-label">{copy.beforeAfter.goodLabel}</div>
            <h3>{copy.beforeAfter.goodTitle}</h3>
            <ul className="ba-list">
              {copy.beforeAfter.goodItems.map((item) => (
                <li key={item}>
                  <span className="mark">
                    <Check size={14} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
