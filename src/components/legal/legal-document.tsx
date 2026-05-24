import Link from "next/link";

import { LegalNav } from "@/components/legal/legal-nav";
import { LEGAL, LEGAL_LAST_UPDATED } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

interface LegalSection {
  title: string;
  content: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  crumb?: string;
  intro?: string;
  sections: LegalSection[];
  className?: string;
}

export function LegalDocument({ title, crumb, intro, sections, className }: LegalDocumentProps) {
  return (
    <>
      <LegalNav crumb={crumb ?? title} />
      <article className={cn("lr-legal-content", className)}>
      <div className="lr-legal-eyebrow">
        {crumb ?? title} · {LEGAL.siteName}
      </div>
      <h1>{title}</h1>
      {intro ? (
        <p className="mt-1.5 text-[17px] text-[var(--slate-600)]">{intro}</p>
      ) : null}
      <p className="mt-3 text-sm text-[var(--slate-500)]">
        Dernière mise à jour : {LEGAL_LAST_UPDATED}
      </p>

      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <div className="space-y-3">{section.content}</div>
        </section>
      ))}

      <footer className="mt-10 rounded-[14px] border border-[var(--slate-200)] bg-[var(--slate-50)] p-5 text-sm text-[var(--slate-600)]">
        <p>
          <strong className="text-[var(--slate-900)]">{LEGAL.operator}</strong> — {LEGAL.legalForm}
        </p>
        <p className="mt-1">SIRET : {LEGAL.siret}</p>
        <p className="mt-1">
          Contact :{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
        </p>
        <p className="mt-3">
          <Link href="/legal" className="font-semibold text-[var(--indigo)]">
            ← Retour aux informations légales
          </Link>
        </p>
      </footer>
      </article>
    </>
  );
}
