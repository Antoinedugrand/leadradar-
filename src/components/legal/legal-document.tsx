import Link from "next/link";

import { LEGAL, LEGAL_LAST_UPDATED } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

interface LegalSection {
  title: string;
  content: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  intro?: string;
  sections: LegalSection[];
  className?: string;
}

export function LegalDocument({ title, intro, sections, className }: LegalDocumentProps) {
  return (
    <article className={cn("mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24", className)}>
      <Link
        href="/legal"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
      >
        ← Informations légales
      </Link>
      <header className="mt-6 border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {LEGAL.siteName} · {LEGAL.domain}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {intro ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p> : null}
        <p className="mt-4 text-sm text-muted-foreground">
          Dernière mise à jour : {LEGAL_LAST_UPDATED}
        </p>
      </header>
      <div className="prose-legal mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
              {section.content}
            </div>
          </section>
        ))}
      </div>
      <footer className="mt-14 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">{LEGAL.operator}</strong> — {LEGAL.legalForm}
        </p>
        <p className="mt-1">SIRET : {LEGAL.siret}</p>
        <p className="mt-1">
          Contact :{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
            {LEGAL.contactEmail}
          </a>
        </p>
      </footer>
    </article>
  );
}
