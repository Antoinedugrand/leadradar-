"use client";

import { Play } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

export function VideoSection({ copy }: { copy: LandingCopy }) {
  return (
    <section id="video" className="dark-section">
      <div className="radar-grid" aria-hidden="true" />
      <div className="container" style={{ position: "relative", textAlign: "center" }}>
        <span className="eyebrow">{copy.video.eyebrow}</span>
        <h2 className="h1" style={{ marginTop: 12, color: "#fff" }}>
          {copy.video.title}
        </h2>
        <p
          className="body-lg"
          style={{
            marginTop: 16,
            maxWidth: 540,
            marginInline: "auto",
            color: "rgba(226,232,240,0.7)",
          }}
        >
          {copy.video.sub}
        </p>
        <div
          className="video-box"
          role="button"
          tabIndex={0}
          onClick={() => {
            /* TODO: open demo video modal when asset is ready */
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
            }
          }}
        >
          <div className="play-btn">
            <Play size={32} aria-hidden="true" fill="currentColor" stroke="none" />
          </div>
          <div className="video-stamp">
            <span className="live">{copy.video.live}</span>
            <span>{copy.video.duration}</span>
            <span>{copy.video.stamp}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
