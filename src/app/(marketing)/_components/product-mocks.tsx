import { Eye, Send, Sparkles } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

export function StepVisualScan() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at center, rgba(6,182,212,0.2), transparent 70%)",
      }}
    >
      <svg viewBox="0 0 240 120" style={{ width: "100%", height: "100%" }} aria-hidden="true">
        <defs>
          <pattern id="scanGrid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M14 0H0V14" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="240" height="120" fill="url(#scanGrid)" />
        <circle cx="120" cy="60" r="44" stroke="rgba(6,182,212,0.35)" strokeWidth="1" fill="none" strokeDasharray="2 4" />
        <circle cx="120" cy="60" r="24" stroke="rgba(6,182,212,0.6)" strokeWidth="1" fill="none" />
        <circle cx="120" cy="60" r="3" fill="#06B6D4" />
        <circle cx="86" cy="46" r="2.5" fill="#EF4444" />
        <circle cx="148" cy="72" r="2.5" fill="#EF4444" />
        <circle cx="138" cy="38" r="2.5" fill="#F59E0B" />
        <circle cx="98" cy="78" r="2.5" fill="#94A3B8" />
      </svg>
    </div>
  );
}

export function StepVisualQualify() {
  const rows = [
    { name: "Joe's Barbershop", score: "No site", color: "#EF4444" },
    { name: "Piña Café & Bakery", score: "34/100", color: "#EF4444" },
    { name: "Thread & Bobbin", score: "52/100", color: "#F59E0B" },
  ];
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((row) => (
        <div
          key={row.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: row.color,
              boxShadow: `0 0 0 3px ${row.color}30`,
            }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", flex: 1 }}>{row.name}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {row.score}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StepVisualPitch({ copy }: { copy: LandingCopy }) {
  return (
    <div style={{ padding: 14 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: 10,
          fontSize: 11,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            color: "var(--cyan-300)",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          <Sparkles size={10} aria-hidden="true" /> {copy.how.pitchLabel}
        </div>
        {copy.how.pitchSnippet}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <span className="pill" style={{ fontSize: 10, padding: "3px 8px" }}>
          <Send size={10} aria-hidden="true" /> {copy.how.send}
        </span>
        <span className="pill" style={{ fontSize: 10, padding: "3px 8px" }}>
          <Eye size={10} aria-hidden="true" /> {copy.how.preview}
        </span>
      </div>
    </div>
  );
}

export function DashboardMock({ copy }: { copy: LandingCopy }) {
  const d = copy.bento.dashboard;
  return (
    <div
      className="canvas"
      style={{
        background: "linear-gradient(135deg, #F1F5F9, #E2EAF5)",
        borderRadius: 14,
        padding: 18,
        border: "1px solid var(--slate-200)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600 }}>
          {d.zone}
        </div>
        <div className="chip" style={{ padding: "4px 8px", fontSize: 11 }}>
          {d.live}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        <div className="dash-stat">
          <div className="lbl">{d.prospects}</div>
          <div className="val">1,284</div>
          <div className="delta">{d.deltaToday}</div>
        </div>
        <div className="dash-stat">
          <div className="lbl">{d.noWebsite}</div>
          <div className="val" style={{ color: "var(--red)" }}>
            312
          </div>
          <div className="delta" style={{ color: "var(--red)" }}>
            {d.deltaPool}
          </div>
        </div>
        <div className="dash-stat">
          <div className="lbl">{d.badSites}</div>
          <div className="val" style={{ color: "var(--amber)" }}>
            418
          </div>
          <div className="delta">{d.deltaAudit}</div>
        </div>
        <div className="dash-stat">
          <div className="lbl">{d.contacted}</div>
          <div className="val">96</div>
          <div className="delta">{d.deltaReplies}</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.8)",
          borderRadius: 10,
          padding: 12,
          height: 100,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--slate-500)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {d.chartLabel}
        </div>
        <svg
          viewBox="0 0 300 60"
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 30,
            width: "calc(100% - 24px)",
            height: 60,
          }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4338CA" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 50 L25 42 L50 46 L75 38 L100 30 L125 32 L150 24 L175 20 L200 14 L225 18 L250 10 L275 8 L300 4 L300 60 L0 60Z"
            fill="url(#dashGrad)"
          />
          <path
            d="M0 50 L25 42 L50 46 L75 38 L100 30 L125 32 L150 24 L175 20 L200 14 L225 18 L250 10 L275 8 L300 4"
            fill="none"
            stroke="#4338CA"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function AuditMock({ copy }: { copy: LandingCopy }) {
  const a = copy.bento.audit;
  return (
    <div
      className="canvas"
      style={{
        background: "#fff",
        border: "1px solid var(--slate-200)",
        borderRadius: 14,
        padding: 18,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="score-arc">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" stroke="var(--slate-100)" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="var(--red)"
              strokeWidth="8"
              fill="none"
              strokeDasharray="263.9"
              strokeDashoffset="174"
              strokeLinecap="round"
            />
          </svg>
          <div className="num">34</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--slate-500)",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {a.scoreLabel}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
            {a.domain}
          </div>
          <div className="badge badge-hot" style={{ marginTop: 4 }}>
            ● {a.hotProspect}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {a.rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              padding: "8px 10px",
              background: "var(--slate-50)",
              borderRadius: 8,
            }}
          >
            <span style={{ color: "var(--slate-700)" }}>{row.label}</span>
            <span className={`badge ${row.val.includes("None") || row.val.includes("Aucun") ? "badge-warm" : "badge-hot"}`}>
              {row.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoSiteMock({ copy }: { copy: LandingCopy }) {
  const d = copy.bento.demo;
  const headlineLines = d.headline.split("\n");
  return (
    <div
      className="canvas"
      style={{
        background: "linear-gradient(135deg, #0F172A, #1E1B4B)",
        borderRadius: 14,
        padding: 16,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(67,56,202,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.3), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 10,
          height: "100%",
          overflow: "hidden",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--slate-100)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
          }}
        >
          <div style={{ display: "flex", gap: 4 }} aria-hidden="true">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#FF5F57" }} />
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#FEBC2E" }} />
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#28C840" }} />
          </div>
          <span className="mono" style={{ fontSize: 10, color: "var(--slate-400)", marginLeft: 6 }}>
            {d.previewUrl}
          </span>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "-0.02em",
              }}
            >
              {d.brand.replace(".", "")}
              <span style={{ color: "var(--red)" }}>.</span>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 9, color: "var(--slate-500)" }}>
              {d.nav.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginTop: 4,
            }}
          >
            {headlineLines[0]}
            <br />
            {headlineLines[1]}
          </div>
          <div style={{ fontSize: 9, color: "var(--slate-500)", maxWidth: 200 }}>{d.sub}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <span
              style={{
                background: "var(--slate-900)",
                color: "#fff",
                fontSize: 9,
                padding: "4px 8px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {d.cta}
            </span>
            <span
              style={{
                background: "var(--slate-100)",
                color: "var(--slate-700)",
                fontSize: 9,
                padding: "4px 8px",
                borderRadius: 4,
              }}
            >
              {d.phone}
            </span>
          </div>
          <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg, #2A2419, #44382A)", borderRadius: 4 }} />
            <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg, #44382A, #6B4F36)", borderRadius: 4 }} />
            <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg, #6B4F36, #2A2419)", borderRadius: 4 }} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
        <span className="badge badge-new" style={{ background: "rgba(16,185,129,0.2)", color: "#6EE7B7" }}>
          <Sparkles size={10} aria-hidden="true" /> {d.generated}
        </span>
      </div>
    </div>
  );
}

export function PipelineMock({ copy }: { copy: LandingCopy }) {
  const p = copy.bento.pipeline;
  const colors = ["#94A3B8", "#3B82F6", "#06B6D4", "#10B981"];
  return (
    <div
      className="canvas"
      style={{
        background: "#fff",
        border: "1px solid var(--slate-200)",
        borderRadius: 14,
        padding: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600 }}>
          {p.badge}
        </div>
        <div className="chip" style={{ padding: "4px 8px", fontSize: 10 }}>
          {p.export}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, height: "calc(100% - 32px)" }}>
        {p.columns.map((col, i) => (
          <div
            key={col.title}
            style={{
              background: "var(--slate-50)",
              borderRadius: 8,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10,
                color: "var(--slate-600)",
                fontWeight: 600,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: colors[i] }} />
              {col.title}
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  color: "var(--slate-400)",
                }}
              >
                {col.count}
              </span>
            </div>
            {col.items.map((item) => (
              <div
                key={item}
                style={{
                  background: "#fff",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--slate-200)",
                  fontSize: 10,
                  color: "var(--slate-700)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
