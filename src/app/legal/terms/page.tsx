import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — LeadRadar",
  description: "Conditions d'utilisation du service LeadRadar.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      crumb="CGU"
      title="Conditions Générales d'Utilisation"
      intro={LEGAL.serviceDescription}
      sections={[
        {
          title: "1. Objet",
          content: (
            <>
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent
                l&apos;accès et l&apos;utilisation du service {LEGAL.siteName}, accessible via{" "}
                {LEGAL.siteUrl}, édité par {LEGAL.operator}, {LEGAL.legalForm}.
              </p>
              <p>
                {LEGAL.serviceDescription} En créant un compte ou en utilisant le service, vous
                acceptez sans réserve les présentes CGU.
              </p>
            </>
          ),
        },
        {
          title: "2. Accès au service",
          content: (
            <>
              <p>
                L&apos;accès au service nécessite la création d&apos;un compte avec une adresse
                e-mail valide. Certaines fonctionnalités sont proposées dans le cadre d&apos;un
                abonnement payant, facturé via Stripe.
              </p>
              <p>
                Vous vous engagez à fournir des informations exactes et à maintenir la
                confidentialité de vos identifiants. Toute activité réalisée depuis votre compte
                est réputée effectuée par vous.
              </p>
            </>
          ),
        },
        {
          title: "3. Obligations de l'utilisateur",
          content: (
            <>
              <p>
                Le service est destiné à un usage professionnel (prospection commerciale B2B
                légitime). Vous vous engagez notamment à :
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>respecter la réglementation applicable (RGPD, ePrivacy, droit de la concurrence) ;</li>
                <li>ne pas utiliser le service pour du spam, du démarchage abusif ou du harcèlement ;</li>
                <li>ne pas tenter de contourner les limites techniques ou de sécurité du service ;</li>
                <li>ne pas revendre, scraper massivement ou réutiliser les données en dehors du cadre prévu.</li>
              </ul>
            </>
          ),
        },
        {
          title: "4. Propriété intellectuelle",
          content: (
            <>
              <p>
                {LEGAL.siteName}, son interface, son code, ses marques et contenus éditoriaux sont
                la propriété exclusive de {LEGAL.operator} ou de ses concédants. Aucune cession de
                droits de propriété intellectuelle n&apos;est consentie au-delà d&apos;une licence
                d&apos;usage limitée, personnelle, non exclusive et non transférable, pour la durée
                de l&apos;abonnement.
              </p>
              <p>
                Les données issues de sources publiques (ex. Google Maps) restent soumises aux
                conditions des fournisseurs concernés.
              </p>
            </>
          ),
        },
        {
          title: "5. Responsabilité",
          content: (
            <>
              <p>
                Les informations sur les prospects proviennent de sources publiques.{" "}
                {LEGAL.operator} ne garantit ni l&apos;exhaustivité, ni l&apos;exactitude, ni
                l&apos;actualisation permanente de ces données. Les audits automatiques de sites
                web sont fournis à titre indicatif.
              </p>
              <p>
                Dans les limites autorisées par la loi, la responsabilité de {LEGAL.operator} est
                limitée aux dommages directs prouvés, dans la limite du montant payé par
                l&apos;utilisateur au cours des douze (12) derniers mois.
              </p>
            </>
          ),
        },
        {
          title: "6. Résiliation et suspension",
          content: (
            <>
              <p>
                Vous pouvez résilier votre abonnement à tout moment depuis les paramètres du
                compte, avant la prochaine échéance de facturation. L&apos;accès reste actif
                jusqu&apos;à la fin de la période payée.
              </p>
              <p>
                {LEGAL.operator} se réserve le droit de suspendre ou résilier un compte en cas de
                violation des CGU, de non-paiement, ou de comportement portant atteinte au service
                ou à des tiers, sans préjudice des recours disponibles.
              </p>
            </>
          ),
        },
        {
          title: "7. Droit applicable et litiges",
          content: (
            <>
              <p>
                Les présentes CGU sont régies par le droit français. En cas de litige, et après
                tentative de résolution amiable, compétence exclusive est attribuée aux tribunaux
                français compétents, sous réserve des dispositions impératives applicables aux
                consommateurs le cas échéant.
              </p>
              <p>
                Pour toute question :{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                  {LEGAL.contactEmail}
                </a>
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
