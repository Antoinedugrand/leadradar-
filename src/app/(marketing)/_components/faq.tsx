"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { LandingCopy } from "@/lib/i18n/landing";

export function FAQ({ copy }: { copy: LandingCopy }) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section id="faq" style={{ background: "var(--slate-50)" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <span className="eyebrow">{copy.faq.eyebrow}</span>
        <h2 className="h1" style={{ marginTop: 12 }}>
          {copy.faq.title}
        </h2>
      </div>
      <div className="container">
        <div className="faq-list">
          {copy.faq.items.map((item, index) => {
            const open = openFaqIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div key={item.q} className={`faq-item${open ? " open" : ""}`}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenFaqIndex(open ? null : index)}
                >
                  <span>{item.q}</span>
                  <span className="plus">
                    <Plus size={14} aria-hidden="true" />
                  </span>
                </button>
                <div className="faq-a" id={panelId} role="region" aria-labelledby={`faq-q-${index}`}>
                  <p style={{ paddingRight: 32 }}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
