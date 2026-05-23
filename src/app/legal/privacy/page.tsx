import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité — LeadRadar",
  description: "Politique de confidentialité et protection des données LeadRadar.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Politique de confidentialité"
      intro="Cette politique décrit comment LeadRadar traite les données personnelles dans le cadre du service SaaS."
      sections={[
        {
          title: "1. Responsable du traitement",
          content: (
            <p>
              {LEGAL.operator}, {LEGAL.legalForm} — SIRET {LEGAL.siret}.
              <br />
              Contact :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                {LEGAL.contactEmail}
              </a>
            </p>
          ),
        },
        {
          title: "2. Données collectées",
          content: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Identité et contact : adresse e-mail, nom le cas échéant ;</li>
              <li>Données de compte et d&apos;usage : préférences, journaux techniques, actions dans l&apos;app ;</li>
              <li>Données de paiement : traitées par Stripe (nous ne stockons pas vos numéros de carte) ;</li>
              <li>Données de prospection : informations publiques sur des établissements (nom, adresse, site web, etc.).</li>
            </ul>
          ),
        },
        {
          title: "3. Finalités",
          content: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Création et gestion de votre compte ;</li>
              <li>Facturation et gestion de l&apos;abonnement ;</li>
              <li>Fourniture des fonctionnalités de recherche, audit et prospection ;</li>
              <li>Support client et sécurité du service ;</li>
              <li>Amélioration du produit (statistiques agrégées, lorsque le consentement analytics est accordé).</li>
            </ul>
          ),
        },
        {
          title: "4. Bases légales",
          content: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Exécution du contrat (article 6.1.b RGPD) pour la fourniture du service ;</li>
              <li>Intérêt légitime (article 6.1.f RGPD) pour la sécurité, la lutte contre la fraude et l&apos;amélioration du service ;</li>
              <li>Consentement (article 6.1.a RGPD) pour les cookies analytiques non essentiels.</li>
            </ul>
          ),
        },
        {
          title: "5. Durée de conservation",
          content: (
            <p>
              Les données de compte sont conservées pendant la durée de l&apos;abonnement, puis
              archivées ou supprimées dans un délai de trois (3) ans à des fins de preuve
              comptable et de gestion des litiges, sauf obligation légale contraire ou demande de
              suppression anticipée lorsque applicable.
            </p>
          ),
        },
        {
          title: "6. Sous-traitants",
          content: (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Stripe</strong> — traitement des paiements (États-Unis / UE selon
                configuration, clauses contractuelles types) ;
              </li>
              <li>
                <strong>Vercel Inc.</strong> — hébergement et exécution de l&apos;application ;
              </li>
              <li>Fournisseurs d&apos;infrastructure et d&apos;API nécessaires au fonctionnement du service.</li>
            </ul>
          ),
        },
        {
          title: "7. Vos droits",
          content: (
            <>
              <p>
                Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification,
                d&apos;effacement, de limitation, d&apos;opposition et de portabilité, lorsque
                applicables.
              </p>
              <p>
                Exercez vos droits en écrivant à{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                  {LEGAL.contactEmail}
                </a>
                . Vous pouvez également introduire une réclamation auprès de la CNIL (
                <a href="https://www.cnil.fr" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  www.cnil.fr
                </a>
                ).
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
