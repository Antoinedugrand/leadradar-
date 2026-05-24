import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Politique de cookies — LeadRadar",
  description: "Politique de cookies et gestion du consentement LeadRadar.",
};

export default function CookiesPage() {
  return (
    <LegalDocument
      crumb="Cookies"
      title="Politique de cookies"
      intro="Cette page explique quels cookies et traceurs sont utilisés sur leadradar.us et comment gérer vos préférences."
      sections={[
        {
          title: "1. Qu'est-ce qu'un cookie ?",
          content: (
            <p>
              Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite
              d&apos;un site. Il permet notamment de mémoriser vos préférences ou de mesurer
              l&apos;audience du site.
            </p>
          ),
        },
        {
          title: "2. Cookies strictement nécessaires",
          content: (
            <>
              <p>Ces cookies sont indispensables au fonctionnement du service. Ils ne peuvent pas être désactivés :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Cookie de session / authentification ;</li>
                <li>Cookie de langue (préférence EN/FR) ;</li>
                <li>Cookie de consentement cookies (<code className="rounded bg-muted px-1">cookie_consent</code> en localStorage).</li>
              </ul>
              <p className="mt-2">Durée : session ou jusqu&apos;à 12 mois selon le cookie.</p>
            </>
          ),
        },
        {
          title: "3. Cookies analytiques",
          content: (
            <>
              <p>
                Avec votre consentement, nous utilisons <strong>Vercel Analytics</strong> pour
                mesurer l&apos;audience de manière agrégée et améliorer le service. Ces cookies ne
                servent pas à la publicité ciblée.
              </p>
              <p className="mt-2">Durée : selon la politique de Vercel (généralement jusqu&apos;à 24 mois).</p>
            </>
          ),
        },
        {
          title: "4. Pas de cookies publicitaires",
          content: (
            <p>
              LeadRadar n&apos;utilise pas de cookies publicitaires, de reciblage ou de profilage
              marketing tiers.
            </p>
          ),
        },
        {
          title: "5. Gérer vos préférences",
          content: (
            <>
              <p>
                Lors de votre première visite, une bannière vous permet d&apos;accepter, refuser
                ou personnaliser les cookies analytiques. Vous pouvez modifier votre choix à tout
                moment via le lien « Gérer mes cookies » en bas de page du site.
              </p>
              <p className="mt-2">
                Vous pouvez aussi configurer votre navigateur pour bloquer les cookies (certaines
                fonctionnalités pourraient alors ne plus fonctionner correctement).
              </p>
            </>
          ),
        },
        {
          title: "6. Contact",
          content: (
            <p>
              Questions :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                {LEGAL.contactEmail}
              </a>
              . Voir aussi la{" "}
              <Link href="/legal/privacy" className="text-indigo-600 hover:underline">
                politique de confidentialité
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
