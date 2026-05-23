import Link from "next/link";

import { LEGAL, LEGAL_LAST_UPDATED } from "@/lib/legal/constants";

const LEGAL_LINKS = [
  { href: "/legal/terms", title: "Conditions Générales d'Utilisation", desc: "Règles d'accès et d'usage du service." },
  { href: "/legal/privacy", title: "Politique de confidentialité", desc: "Données collectées, finalités et vos droits." },
  { href: "/legal/gdpr", title: "RGPD / DPA", desc: "Conformité et traitements des données." },
  { href: "/legal/cookies", title: "Politique de cookies", desc: "Cookies utilisés et gestion du consentement." },
] as const;

export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Retour à l&apos;accueil
      </Link>
      <header className="mt-6 border-b border-border pb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Informations légales
        </h1>
        <p className="mt-4 text-muted-foreground">
          Documents légaux relatifs au service {LEGAL.siteName} ({LEGAL.domain}).
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
      </header>

      <section className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Mentions légales
        </h2>
        <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground">Éditeur du site</dt>
            <dd>
              {LEGAL.operator} — {LEGAL.legalForm}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">SIRET</dt>
            <dd>{LEGAL.siret}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Contact</dt>
            <dd>
              <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                {LEGAL.contactEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Hébergeur</dt>
            <dd>
              {LEGAL.host.name}, {LEGAL.host.address}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Site</dt>
            <dd>{LEGAL.siteUrl}</dd>
          </div>
        </dl>
      </section>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <h2 className="font-semibold text-foreground">{link.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
