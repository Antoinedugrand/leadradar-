import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "RGPD / DPA — LeadRadar",
  description: "Informations RGPD et accord de traitement des données LeadRadar.",
};

export default function GdprPage() {
  return (
    <LegalDocument
      title="RGPD / Accord de traitement des données (DPA)"
      intro="LeadRadar s'engage à respecter le Règlement général sur la protection des données (RGPD) pour les utilisateurs du SaaS et les données traitées dans le cadre du service."
      sections={[
        {
          title: "1. Conformité RGPD",
          content: (
            <p>
              {LEGAL.operator} met en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger les données personnelles. Le service est conçu pour aider
              les professionnels à mener une prospection B2B conforme, sans collecter de données
              sensibles au sens de l&apos;article 9 du RGPD.
            </p>
          ),
        },
        {
          title: "2. Traitements effectués",
          content: (
            <>
              <p>
                <strong>Données des utilisateurs du SaaS</strong> : compte, facturation, logs
                techniques, support.
              </p>
              <p className="mt-2">
                <strong>Données prospects</strong> : informations sur des établissements et
                professionnels issues de sources publiques (Google Maps / Places, sites web
                publics). Il s&apos;agit de données professionnelles rendues publiques par les
                établissements concernés, et non de données sensibles.
              </p>
            </>
          ),
        },
        {
          title: "3. Rôle des parties",
          content: (
            <>
              <p>
                Pour les données de votre compte utilisateur, {LEGAL.operator} agit en qualité de
                responsable de traitement.
              </p>
              <p className="mt-2">
                Pour les opérations de prospection que vous menez via l&apos;outil (emails,
                suivi), vous agissez en responsable de traitement vis-à-vis de vos contacts, et{" "}
                {LEGAL.operator} intervient en sous-traitant pour la mise à disposition technique
                du service. Un DPA (Data Processing Agreement) peut être fourni sur demande à{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                  {LEGAL.contactEmail}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          title: "4. Base légale — données prospects",
          content: (
            <p>
              Le traitement des données prospects publiques repose sur l&apos;intérêt légitime
              (article 6.1.f RGPD) de permettre aux professionnels d&apos;identifier des
              opportunités commerciales B2B, sous réserve du respect des droits des personnes
              concernées et des règles applicables au démarchage.
            </p>
          ),
        },
        {
          title: "5. Droits des personnes concernées",
          content: (
            <p>
              Toute personne peut exercer ses droits (accès, rectification, effacement,
              opposition, limitation) en contactant{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                {LEGAL.contactEmail}
              </a>
              . Les demandes sont traitées dans un délai maximal d&apos;un mois.
            </p>
          ),
        },
        {
          title: "6. Contact « DPO »",
          content: (
            <p>
              {LEGAL.operator} n&apos;a pas désigné de DPO au sens strict (non requis pour cette
              activité). Le point de contact données et vie privée est :{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                {LEGAL.contactEmail}
              </a>
            </p>
          ),
        },
        {
          title: "7. English summary",
          content: (
            <>
              <p>
                LeadRadar is GDPR-aware. We process (1) SaaS user account/billing data as
                controller, and (2) publicly available business prospect data from sources like
                Google Maps. Users remain controller for their outreach activities. Public
                prospect data is processed on legitimate interest grounds. Contact:{" "}
                <a href={`mailto:${LEGAL.contactEmail}`} className="text-indigo-600 hover:underline">
                  {LEGAL.contactEmail}
                </a>
                . A DPA is available on request.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
