import { ArrowRight, Check, Globe, Lock, Shield, Sparkles } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

export function Pricing({ copy }: { copy: LandingCopy }) {
  const p = copy.pricing;
  return (
    <section id="pricing" style={{ background: "#fff" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <span className="eyebrow">{p.eyebrow}</span>
        <h2 className="h1" style={{ marginTop: 12 }}>
          {p.title}
        </h2>
        <p className="body-lg" style={{ marginTop: 16, maxWidth: 520, marginInline: "auto" }}>
          {p.sub}
        </p>

        <div className="pricing-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: "-0.015em",
                }}
              >
                {p.planName}
              </div>
              <div style={{ fontSize: 13, color: "var(--slate-500)", marginTop: 4 }}>
                {p.planSub}
              </div>
            </div>
            <span className="badge badge-new">
              <Sparkles size={11} aria-hidden="true" /> {p.launching}
            </span>
          </div>

          <div className="price">
            <span className="currency">$</span>
            <span className="amt">29.99</span>
            <span className="per">{p.perMonth}</span>
          </div>

          <ul className="pricing-features">
            {p.features.map((feat) => (
              <li key={feat}>
                <span className="check">
                  <Check size={12} aria-hidden="true" />
                </span>
                {feat}
              </li>
            ))}
          </ul>

          <a className="btn btn-gradient btn-lg" href="/dashboard" style={{ width: "100%", justifyContent: "center" }}>
            {copy.hero.ctaPrimary}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <div className="footnote">{p.footnote}</div>
        </div>

        <div className="trust-row">
          <span className="trust-pill">
            <Lock size={13} aria-hidden="true" /> {p.trustSsl}
          </span>
          <span className="trust-pill">
            <Shield size={13} aria-hidden="true" /> {p.trustGdpr}
          </span>
          <span className="trust-pill">
            <Globe size={13} aria-hidden="true" /> {p.trustLang}
          </span>
          <span className="trust-pill mono" style={{ letterSpacing: 0 }}>
            {p.trustPayments}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 12 }}>{p.caveat}</div>
      </div>
    </section>
  );
}
