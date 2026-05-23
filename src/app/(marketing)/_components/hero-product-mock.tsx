"use client";

import { useState } from "react";
import {
  BarChart3,
  Filter,
  Inbox,
  LayoutGrid,
  Map,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

function MapBackground() {
  return (
    <div className="map-streets">
      <svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="block" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="#EAF1F8" />
            <rect x="6" y="6" width="46" height="46" fill="#DEE7F2" rx="2" />
            <rect x="62" y="6" width="52" height="32" fill="#DEE7F2" rx="2" />
            <rect x="62" y="46" width="22" height="68" fill="#DEE7F2" rx="2" />
            <rect x="92" y="46" width="22" height="68" fill="#DEE7F2" rx="2" />
            <rect x="6" y="62" width="46" height="52" fill="#DEE7F2" rx="2" />
          </pattern>
        </defs>
        <rect width="800" height="560" fill="url(#block)" />
        <path d="M-20 380 L820 120" stroke="#fff" strokeWidth="14" opacity="0.9" />
        <path d="M-20 380 L820 120" stroke="#F5F9FF" strokeWidth="1" />
        <path d="M120 -20 L520 580" stroke="#fff" strokeWidth="10" opacity="0.9" />
        <path d="M-20 200 L820 380" stroke="#fff" strokeWidth="6" opacity="0.7" />
        <path
          d="M620 420 Q700 380 760 440 L800 480 L800 560 L580 560 Z"
          fill="#CDE2F2"
          opacity="0.7"
        />
        <path
          d="M40 80 Q120 50 180 90 L220 130 L130 170 L60 140 Z"
          fill="#D8E9D3"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

const PINS = [
  { id: "joe", x: 48, y: 50, kind: "hot" },
  { id: "pina", x: 35, y: 38, kind: "hot" },
  { id: "thread", x: 56, y: 32, kind: "warm" },
  { id: "morrow", x: 64, y: 58, kind: "hot" },
  { id: "ember", x: 42, y: 62, kind: "warm" },
  { id: "lockbox", x: 30, y: 55, kind: "cold" },
  { id: "salt", x: 55, y: 70, kind: "warm" },
  { id: "lyon", x: 70, y: 42, kind: "cold" },
  { id: "pacific", x: 22, y: 48, kind: "hot" },
] as const;

function MapMockup({
  copy,
  selectedId,
}: {
  copy: LandingCopy;
  selectedId: string;
}) {
  return (
    <div className="app-map">
      <MapBackground />
      <div className="radius-circle" aria-hidden="true" />
      <div className="map-toolbar">
        <div className="map-search">
          <Search size={14} aria-hidden="true" />
          <span style={{ color: "var(--slate-500)" }}>{copy.mock.mapSearch}</span>
          <span className="kbd">⌘K</span>
        </div>
        <div className="chip active">
          <Filter size={12} aria-hidden="true" /> {copy.mock.filters}
        </div>
        <div className="chip hot">
          <span
            className="dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "var(--red)",
            }}
          />
          {copy.mock.noWebsite}
        </div>
        <div className="chip warm hide-mobile">{copy.mock.mobileFailing}</div>
        <div className="chip hide-mobile">{copy.mock.radius}</div>
      </div>

      {PINS.map((pin) => (
        <div
          key={pin.id}
          className={`pin ${pin.kind}${pin.id === selectedId ? " selected" : ""}`}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          aria-hidden="true"
        >
          <span className="head" />
          <span className="tail" />
        </div>
      ))}

      <div className="map-overlay-card">
        <div
          style={{
            fontSize: 11,
            color: "var(--slate-500)",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {copy.mock.zoneLabel}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span>{copy.mock.businessesFound}</span>
          <strong>237</strong>
        </div>
        <div className="row">
          <span>{copy.mock.noWebsite}</span>
          <strong style={{ color: "var(--red)" }}>48</strong>
        </div>
        <div className="row">
          <span>{copy.mock.auditLow}</span>
          <strong style={{ color: "var(--amber)" }}>62</strong>
        </div>
      </div>
    </div>
  );
}

function ProspectPanel({
  copy,
  selectedId,
  onSelect,
}: {
  copy: LandingCopy;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const badgeFor = (kind: "hot" | "warm" | "cold") => {
    if (kind === "hot") return copy.mock.badgeHot;
    if (kind === "warm") return copy.mock.badgeWarm;
    return copy.mock.badgeCold;
  };

  return (
    <div className="app-panel">
      <div className="panel-head">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{copy.mock.prospectsTitle}</div>
          <div className="count">{copy.mock.prospectsCount}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className="chip" style={{ padding: "4px 8px", fontSize: 11 }}>
            {copy.mock.hotFilter}
          </button>
        </div>
      </div>
      <div className="panel-list">
        {copy.mock.prospects.map((prospect) => (
          <div
            key={prospect.id}
            role="button"
            tabIndex={0}
            className={`prospect${prospect.id === selectedId ? " selected" : ""}`}
            onClick={() => onSelect(prospect.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(prospect.id);
              }
            }}
          >
            <div
              className="avatar"
              style={{
                background:
                  prospect.kind === "hot"
                    ? "rgba(239,68,68,0.1)"
                    : prospect.kind === "warm"
                      ? "rgba(245,158,11,0.1)"
                      : "var(--slate-100)",
                color:
                  prospect.kind === "hot"
                    ? "var(--red)"
                    : prospect.kind === "warm"
                      ? "var(--amber)"
                      : "var(--slate-600)",
              }}
            >
              {prospect.initials}
            </div>
            <div className="meta">
              <div className="name">{prospect.name}</div>
              <div className="sub">{prospect.sub}</div>
            </div>
            <div className="right">
              <span className={`badge badge-${prospect.kind}`}>{badgeFor(prospect.kind)}</span>
              <span className="score">{prospect.score}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="panel-footer">
        <Zap
          size={11}
          style={{ color: "var(--cyan)", verticalAlign: "middle", marginRight: 4 }}
          aria-hidden="true"
        />
        {copy.mock.aiScoring}
      </div>
    </div>
  );
}

function EmailPreview({ copy }: { copy: LandingCopy }) {
  return (
    <div className="email-preview">
      <div className="meta-row">
        <Sparkles size={11} style={{ color: "var(--indigo)" }} aria-hidden="true" />
        <span style={{ color: "var(--indigo)", fontWeight: 600 }}>{copy.mock.emailDraft}</span>
        <span>· {copy.mock.emailTo}</span>
      </div>
      <h5>{copy.mock.emailSubject}</h5>
      <p>
        {copy.mock.emailBodyBefore}
        <span className="highlight">{copy.mock.emailHighlight}</span>
        {copy.mock.emailBodyAfter}
      </p>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <span className="badge badge-indigo">
          <Wand2 size={10} aria-hidden="true" /> {copy.mock.generated}
        </span>
        <span className="badge badge-new">{copy.mock.demoAttached}</span>
      </div>
    </div>
  );
}

export function HeroProductMock({ copy }: { copy: LandingCopy }) {
  const [selectedId, setSelectedId] = useState("joe");

  return (
    <section aria-label={copy.mock.productPreview} className="hero-product">
      <div className="app-frame">
        <div className="app-titlebar">
          <div className="tl-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="tl-url">{copy.mock.appUrl}</div>
          <div className="tl-right">
            <span />
            <span />
          </div>
        </div>
        <div className="app-body">
          <div className="app-side">
            <div className="logo-mark">L</div>
            <div className="ico active">
              <Map size={16} aria-hidden="true" />
            </div>
            <div className="ico">
              <Inbox size={16} aria-hidden="true" />
            </div>
            <div className="ico">
              <BarChart3 size={16} aria-hidden="true" />
            </div>
            <div className="ico">
              <LayoutGrid size={16} aria-hidden="true" />
            </div>
            <div className="ico">
              <SlidersHorizontal size={16} aria-hidden="true" />
            </div>
          </div>
          <MapMockup copy={copy} selectedId={selectedId} />
          <ProspectPanel copy={copy} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
      <EmailPreview copy={copy} />
    </section>
  );
}
