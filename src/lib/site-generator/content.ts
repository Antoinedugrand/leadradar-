import type { Prospect } from "@/lib/types";
import type { PlaceEnrichment, SiteContent, SiteGeneratorInput } from "@/lib/site-generator/types";

function normalizeType(type: string | null): string {
  if (!type) return "établissement";
  return type.replace(/_/g, " ");
}

export function buildSiteGeneratorInput(
  prospect: Prospect,
  enrichment: PlaceEnrichment,
): SiteGeneratorInput {
  return {
    name: prospect.name,
    type: prospect.type,
    address: prospect.address,
    city: prospect.city,
    phone: prospect.phone,
    googleRating: prospect.google_rating,
    googleReviewCount: prospect.google_review_count,
    reviewSummary: prospect.review_insights?.summary?.trim() ?? null,
    enrichment,
  };
}

export function fallbackSiteContent(input: SiteGeneratorInput): SiteContent {
  const typeLabel = normalizeType(input.type);
  const place = input.city ?? input.address?.split(",").at(-2)?.trim() ?? "votre quartier";

  return {
    tagline: `${typeLabel.charAt(0).toUpperCase()}${typeLabel.slice(1)} de confiance à ${place}`,
    about:
      input.enrichment.editorialSummary ??
      `${input.name} accueille ses clients avec soin. Retrouvez ici l'essentiel : coordonnées, horaires et ce qui fait la différence au quotidien.`,
    services: defaultServices(input.type),
    ctaText: input.phone ? "Appelez-nous" : "Nous contacter",
  };
}

function defaultServices(type: string | null): [string, string, string] {
  const key = (type ?? "").toLowerCase();

  if (key.includes("restaurant") || key.includes("food") || key.includes("cafe")) {
    return [
      "Produits frais et recettes maison",
      "Ambiance conviviale pour tous les moments",
      "Réservation et accueil sur place",
    ];
  }

  if (key.includes("hair") || key.includes("beauty") || key.includes("spa")) {
    return [
      "Conseils personnalisés pour chaque client",
      "Prestations soignées et accueil chaleureux",
      "Prise de rendez-vous simple",
    ];
  }

  if (key.includes("gym") || key.includes("sport")) {
    return [
      "Encadrement adapté à tous les niveaux",
      "Espace équipé pour progresser sereinement",
      "Horaires flexibles pour s'entraîner",
    ];
  }

  if (key.includes("lodging") || key.includes("hotel")) {
    return [
      "Chambres confortables et accueil attentionné",
      "Emplacement pratique pour visiter la région",
      "Réservation directe sans complication",
    ];
  }

  return [
    "Un service de proximité à votre écoute",
    "Des prestations claires et un accueil simple",
    "Coordonnées et horaires toujours accessibles",
  ];
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

export function normalizeSiteContent(
  raw: Partial<SiteContent>,
  input: SiteGeneratorInput,
): SiteContent | null {
  const fallback = fallbackSiteContent(input);

  const tagline = typeof raw.tagline === "string" ? raw.tagline.trim().slice(0, 120) : "";
  const about = typeof raw.about === "string" ? raw.about.trim().slice(0, 600) : "";
  const ctaText = typeof raw.ctaText === "string" ? raw.ctaText.trim().slice(0, 40) : "";
  const servicesRaw = Array.isArray(raw.services) ? raw.services : [];

  const services = [
    typeof servicesRaw[0] === "string" ? servicesRaw[0].trim().slice(0, 120) : fallback.services[0],
    typeof servicesRaw[1] === "string" ? servicesRaw[1].trim().slice(0, 120) : fallback.services[1],
    typeof servicesRaw[2] === "string" ? servicesRaw[2].trim().slice(0, 120) : fallback.services[2],
  ] as [string, string, string];

  if (tagline.length < 8 || about.length < 40 || !ctaText) {
    return null;
  }

  return { tagline, about, services, ctaText };
}

export function buildContentPrompt(input: SiteGeneratorInput): string {
  const typeLabel = normalizeType(input.type);
  const facts = [
    `- Nom : ${input.name}`,
    `- Activité : ${typeLabel}`,
    `- Adresse : ${input.address ?? "—"}`,
    `- Ville : ${input.city ?? "—"}`,
    `- Téléphone : ${input.phone ?? "non renseigné"}`,
    input.googleRating !== null
      ? `- Note Google : ${input.googleRating}★ (${input.googleReviewCount ?? 0} avis)`
      : null,
    input.enrichment.editorialSummary
      ? `- Description Google : ${input.enrichment.editorialSummary}`
      : null,
    input.reviewSummary ? `- Synthèse avis clients : ${input.reviewSummary}` : null,
    input.enrichment.openingHours?.length
      ? `- Horaires : ${input.enrichment.openingHours.join(" ; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Tu rédiges le contenu d'une page vitrine one-page en français pour une TPE locale en France.
C'est une MAQUETTE DE DÉMONSTRATION créée par un freelance web pour montrer au commerçant à quoi pourrait ressembler son futur site.

Données factuelles (ne pas inventer d'adresse, téléphone ou horaires absents) :
${facts}

Consignes :
- Ton chaleureux, professionnel, orienté clients locaux.
- Pas de jargon marketing ("solutions digitales", "expertise", "clé en main").
- Ne prétends pas que le site existe déjà : c'est une proposition.
- Les 3 services doivent correspondre au type d'activité.

Réponds UNIQUEMENT avec ce JSON (pas de markdown) :
{"tagline":"accroche courte ≤ 90 caractères","about":"2 à 3 phrases présentant l'établissement (80 à 280 caractères)","services":["point 1","point 2","point 3"],"ctaText":"texte bouton CTA court (ex: Réserver une table)"}`;
}
