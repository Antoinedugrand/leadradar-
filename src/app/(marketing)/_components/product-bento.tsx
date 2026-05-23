import { ArrowRight } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

import {
  AuditMock,
  DashboardMock,
  DemoSiteMock,
  PipelineMock,
} from "./product-mocks";

export function ProductBento({ copy }: { copy: LandingCopy }) {
  const b = copy.bento;
  return (
    <section style={{ background: "#fff" }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <span className="eyebrow">{b.eyebrow}</span>
            <h2 className="h1" style={{ marginTop: 12 }}>
              {b.title}
            </h2>
          </div>
          <a className="btn btn-ghost" href="#video">
            {b.watchDemo}{" "}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>

        <div className="bento">
          <div className="bento-cell" style={{ gridRow: "1 / span 2" }}>
            <span className="badge badge-indigo" style={{ alignSelf: "flex-start" }}>
              {b.dashboard.badge}
            </span>
            <h3 style={{ marginTop: 12 }}>{b.dashboard.title}</h3>
            <p>{b.dashboard.body}</p>
            <DashboardMock copy={copy} />
          </div>

          <div className="bento-cell">
            <span className="badge badge-indigo" style={{ alignSelf: "flex-start" }}>
              {b.audit.badge}
            </span>
            <h3 style={{ marginTop: 12 }}>{b.audit.title}</h3>
            <p>{b.audit.body}</p>
            <AuditMock copy={copy} />
          </div>

          <div
            className="bento-cell"
            style={{ background: "#0F172A", color: "#fff", border: 0 }}
          >
            <span
              className="badge"
              style={{
                alignSelf: "flex-start",
                background: "rgba(6,182,212,0.15)",
                color: "var(--cyan-300)",
              }}
            >
              {b.demo.badge}
            </span>
            <h3 style={{ marginTop: 12, color: "#fff" }}>{b.demo.title}</h3>
            <p style={{ color: "rgba(226,232,240,0.7)" }}>{b.demo.body}</p>
            <DemoSiteMock copy={copy} />
          </div>

          <div className="bento-cell" style={{ gridColumn: "1 / span 2" }}>
            <div style={{ maxWidth: 360 }}>
              <span className="badge badge-indigo">{b.pipeline.badge}</span>
              <h3 style={{ marginTop: 12 }}>{b.pipeline.title}</h3>
              <p>{b.pipeline.body}</p>
            </div>
            <PipelineMock copy={copy} />
          </div>
        </div>
      </div>
    </section>
  );
}
