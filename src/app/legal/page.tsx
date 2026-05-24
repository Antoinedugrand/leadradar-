import Link from "next/link";
import { Building2, Check, Lock, Shield } from "lucide-react";

import { LegalNav } from "@/components/legal/legal-nav";
import { LEGAL, LEGAL_LAST_UPDATED } from "@/lib/legal/constants";

const LEGAL_LINKS = [
  {
    href: "/legal/terms",
    title: "Conditions Générales d'Utilisation",
    desc: "Règles d'accès et d'usage du service.",
    icon: Building2,
  },
  {
    href: "/legal/privacy",
    title: "Politique de confidentialité",
    desc: "Données collectées, finalités et vos droits.",
    icon: Shield,
  },
  {
    href: "/legal/gdpr",
    title: "RGPD / DPA",
    desc: "Conformité et traitements des données.",
    icon: Lock,
  },
  {
    href: "/legal/cookies",
    title: "Politique de cookies",
    desc: "Cookies utilisés et gestion du consentement.",
    icon: Check,
  },
] as const;

export default function LegalIndexPage() {
  return (
    <>
      <LegalNav />
      <div className="lr-legal-content">
      <div className="lr-legal-eyebrow">Légal</div>
      <h1>Informations légales & politiques.</h1>
      <p className="mt-1.5 max-w-[640px] text-[17px] text-[var(--slate-600)]">
        Documents légaux relatifs au service {LEGAL.siteName}. Pour toute question :{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <div className="lr-legal-cards">
        {LEGAL_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="lr-legal-card no-underline">
              <span className="lr-legal-card-ico">
                <Icon size={17} />
              </span>
              <h3>{link.title}</h3>
              <p>{link.desc}</p>
              <span className="arrow">Lire le document →</span>
            </Link>
          );
        })}
      </div>

      <h2>Dernière mise à jour</h2>
      <p>
        Tous les documents ci-dessus ont été révisés le <strong>{LEGAL_LAST_UPDATED}</strong>.
      </p>

      <h2>Éditeur</h2>
      <p>
        <strong>{LEGAL.operator}</strong> — {LEGAL.legalForm}
        <br />
        SIRET {LEGAL.siret}
        <br />
        Contact : <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
      </p>

      <h2>Hébergement</h2>
      <p>
        <strong>{LEGAL.host.name}</strong>
        <br />
        {LEGAL.host.address}
      </p>

      <h2>Description du service</h2>
      <p>{LEGAL.serviceDescription}</p>
      </div>
    </>
  );
}
