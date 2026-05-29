import type { Locale } from "@/lib/i18n/types";
import type { Prospect } from "@/lib/types";

export interface EmailVariable {
  token: string;
  label: string;
  value: string;
}

function normalizePlaceType(type: string | null, locale: Locale): string {
  if (!type) {
    return locale === "en" ? "business" : "établissement";
  }
  return type.replace(/_/g, " ");
}

function resolveCity(prospect: Prospect): string {
  if (prospect.city?.trim()) {
    return prospect.city.trim();
  }
  const address = prospect.address ?? "";
  const firstPart = address.split(",")[0]?.trim();
  return firstPart ?? "—";
}

function resolveMainIssue(prospect: Prospect, locale: Locale): string {
  const firstIssue = (prospect.audit_issues ?? []).find(
    (line) => typeof line === "string" && line.trim().length > 0,
  );
  if (firstIssue) {
    return firstIssue.trim();
  }
  if (prospect.audit_summary?.trim()) {
    return prospect.audit_summary.trim();
  }
  return locale === "en" ? "website improvement opportunity" : "piste d'amélioration du site";
}

function resolveSenderPlaceholder(locale: Locale): string {
  return locale === "en" ? "[Your first name]" : "[Votre prénom]";
}

export function getEmailVariables(prospect: Prospect, locale: Locale): EmailVariable[] {
  if (locale === "en") {
    return [
      {
        token: "{business_name}",
        label: "Business name",
        value: prospect.name,
      },
      {
        token: "{city}",
        label: "City",
        value: resolveCity(prospect),
      },
      {
        token: "{business_type}",
        label: "Business type",
        value: normalizePlaceType(prospect.type, locale),
      },
      {
        token: "{main_issue}",
        label: "Main issue",
        value: resolveMainIssue(prospect, locale),
      },
      {
        token: "{sender_name}",
        label: "Sender name",
        value: resolveSenderPlaceholder(locale),
      },
    ];
  }

  return [
    {
      token: "{nom_etablissement}",
      label: "Nom établissement",
      value: prospect.name,
    },
    {
      token: "{ville}",
      label: "Ville",
      value: resolveCity(prospect),
    },
    {
      token: "{type_etablissement}",
      label: "Type établissement",
      value: normalizePlaceType(prospect.type, locale),
    },
    {
      token: "{probleme_principal}",
      label: "Problème principal",
      value: resolveMainIssue(prospect, locale),
    },
    {
      token: "{expediteur_nom}",
      label: "Expéditeur",
      value: resolveSenderPlaceholder(locale),
    },
  ];
}
