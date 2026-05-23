import {
  Gauge,
  LineChart,
  Mail,
  Map,
  Monitor,
  Target,
  Workflow,
} from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

const ICONS = [Map, Target, Gauge, Mail, Monitor, Workflow] as const;

export function FeaturesGrid({ copy }: { copy: LandingCopy }) {
  return (
    <section id="features" style={{ background: "var(--slate-50)" }}>
      <div className="container">
        <div style={{ maxWidth: 720 }}>
          <span className="eyebrow">{copy.features.eyebrow}</span>
          <h2 className="h1" style={{ marginTop: 12 }}>
            {copy.features.title}
          </h2>
        </div>
        <div className="features-grid">
          {copy.features.items.map((feature, index) => {
            const Icon = ICONS[index] ?? LineChart;
            return (
              <div className="feature" key={feature.num}>
                <span className="num mono">{feature.num}</span>
                <div className="ficon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
