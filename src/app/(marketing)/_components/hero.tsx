import { ArrowRight, Check, Play } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

import { HeroProductMock } from "./hero-product-mock";

interface HeroProps {
  copy: LandingCopy;
  headlineVariant: "A" | "B";
}

export function Hero({ copy, headlineVariant }: HeroProps) {
  const headline =
    headlineVariant === "B" ? copy.hero.headlineB : copy.hero.headlineA;

  return (
    <section className="hero" id="top">
      <div className="radar-sweep-wrap" aria-hidden="true">
        <span className="radar-ring r4" />
        <span className="radar-ring r3" />
        <span className="radar-ring r2" />
        <span className="radar-ring r1" />
        <span className="radar-sweep" />
      </div>
      <div className="container">
        <div className="hero-inner">
          <span className="pill">
            <span className="dot" />
            {copy.hero.badge}
          </span>
          <h1 className="h-display" style={{ marginTop: 18 }}>
            {headline}
          </h1>
          <p
            className="body-lg"
            style={{ marginTop: 18, maxWidth: 640, marginInline: "auto" }}
          >
            {copy.hero.sub}
          </p>
          <div className="hero-cta">
            <a className="btn btn-gradient btn-lg" href="#pricing">
              {copy.hero.ctaPrimary}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a className="btn btn-secondary btn-lg" href="#video">
              <Play size={14} aria-hidden="true" fill="currentColor" stroke="none" />
              {copy.hero.ctaSecondary}
            </a>
          </div>
          <div className="hero-meta">
            {copy.hero.meta.map((item) => (
              <span key={item}>
                <Check size={14} style={{ color: "var(--emerald)" }} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <HeroProductMock copy={copy} />
      </div>
    </section>
  );
}
