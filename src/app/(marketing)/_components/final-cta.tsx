import { ArrowRight } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

export function FinalCTA({ copy }: { copy: LandingCopy }) {
  return (
    <div className="container">
      <div className="final-cta">
        <span
          className="pill"
          style={{
            background: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.14)",
            color: "#fff",
          }}
        >
          <span className="dot" />
          {copy.finalCta.pill}
        </span>
        <h2 style={{ marginTop: 18 }}>{copy.finalCta.title}</h2>
        <p>{copy.finalCta.sub}</p>
        <a className="btn btn-gradient btn-lg" href="#pricing">
          {copy.hero.ctaPrimary}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
