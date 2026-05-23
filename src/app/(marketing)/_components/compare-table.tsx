import { Check, LayoutGrid, X } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

import { LogoMark } from "./logo-mark";

export function CompareTable({ copy }: { copy: LandingCopy }) {
  return (
    <section id="compare" style={{ background: "var(--slate-50)" }}>
      <div className="container">
        <div style={{ maxWidth: 720 }}>
          <span className="eyebrow">{copy.compare.eyebrow}</span>
          <h2 className="h1" style={{ marginTop: 12 }}>
            {copy.compare.title}
          </h2>
          <p className="body-lg" style={{ marginTop: 18, maxWidth: 580 }}>
            {copy.compare.sub}
          </p>
        </div>

        <div className="compare">
          <div className="compare-row header">
            <div className="col-feature" />
            <div className="col-manual">
              <LayoutGrid size={16} style={{ verticalAlign: "middle", marginRight: 8 }} aria-hidden="true" />
              {copy.compare.manual}
            </div>
            <div className="col-product">
              <LogoMark size={20} />
              <span style={{ verticalAlign: "middle", marginLeft: 6 }}>{copy.compare.product}</span>
            </div>
          </div>
          {copy.compare.rows.map((row) => (
            <div className="compare-row" key={row.feature}>
              <div className="label">{row.feature}</div>
              <div className="manual">
                <span className="cross">
                  <X size={14} style={{ verticalAlign: "middle" }} aria-hidden="true" />
                </span>
                {row.manual}
              </div>
              <div className="leadradar">
                <span className="check">
                  <Check size={14} style={{ verticalAlign: "middle" }} aria-hidden="true" />
                </span>
                {row.product}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
