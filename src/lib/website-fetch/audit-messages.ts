import type { Locale } from "@/lib/i18n/types";

export interface AuditMessages {
  blockedByBot: (status: number | null) => string;
  blockedIssue: (status: number | null) => string;
  serverUnreachable: string;
  serverUnreachableIssue: string;
  noViewport: string;
  noHttps: string;
  slowLoad: string;
  legacySite: string;
  noMetaDescription: string;
  noOpenGraph: string;
  manyTables: string;
  heuristicSummaryWithIssues: (count: number) => string;
  heuristicSummaryClean: string;
  heuristicNoCriticalIssue: string;
  claudeFallbackFailed: string;
  claudeFallbackInvalid: string;
  htmlUnavailableFallback: string;
  auditComplete: string;
  manualReviewFallback: string;
}

const EN_MESSAGES: AuditMessages = {
  blockedByBot: (status) =>
    status
      ? `Automated access blocked (HTTP ${status}) — the site is still reachable manually.`
      : "Automated access blocked — the site is likely still reachable manually.",
  blockedIssue: (status) =>
    status
      ? `Server access blocked (HTTP ${status}), partial audit only.`
      : "Server access blocked, partial audit only.",
  serverUnreachable: "Could not reach the site from the server — check the URL manually.",
  serverUnreachableIssue: "Site unreachable from the server (DNS, timeout, or HTTP 404).",
  noViewport: "Site seems poorly optimized for mobile (missing viewport meta tag).",
  noHttps: "Site does not use HTTPS.",
  slowLoad: "Page load time appears slow.",
  legacySite: "Site appears outdated (signs before 2015).",
  noMetaDescription: "Meta description missing or weak for SEO.",
  noOpenGraph: "No Open Graph markup (social previews often look poor).",
  manyTables: "Heavy table-based layout (often a sign of an outdated site).",
  heuristicSummaryWithIssues: (count) =>
    `Site with several technical issues (${count} point${count > 1 ? "s" : ""}).`,
  heuristicSummaryClean: "No obvious critical issues detected in a quick scan.",
  heuristicNoCriticalIssue: "No critical issue detected by the heuristic scan.",
  claudeFallbackFailed: "AI analysis failed, heuristic fallback used.",
  claudeFallbackInvalid: "Invalid Claude response, heuristic fallback used.",
  htmlUnavailableFallback: "HTML unavailable, heuristic fallback used.",
  auditComplete: "Audit complete.",
  manualReviewFallback: "Quick scan without a clear verdict — review the site manually.",
};

const FR_MESSAGES: AuditMessages = {
  blockedByBot: (status) =>
    status
      ? `Accès automatisé bloqué (HTTP ${status}) — le site reste accessible manuellement.`
      : "Accès automatisé bloqué — le site reste probablement accessible manuellement.",
  blockedIssue: (status) =>
    status
      ? `Accès serveur bloqué (HTTP ${status}), audit partiel uniquement.`
      : "Accès serveur bloqué, audit partiel uniquement.",
  serverUnreachable:
    "Impossible de joindre le site depuis le serveur — vérifiez l'URL manuellement.",
  serverUnreachableIssue: "Site injoignable depuis le serveur (DNS, timeout ou HTTP 404).",
  noViewport: "Le site semble peu adapté mobile (meta viewport absente).",
  noHttps: "Le site n'utilise pas HTTPS.",
  slowLoad: "Le temps de chargement semble lent.",
  legacySite: "Le site semble ancien (indices antérieurs à 2015).",
  noMetaDescription: "Meta description absente ou peu exploitable pour le SEO.",
  noOpenGraph: "Pas de balisage Open Graph (aperçu partage réseaux souvent médiocre).",
  manyTables: "Mise en page très tabulaire (souvent signe d'un site daté).",
  heuristicSummaryWithIssues: (count) =>
    `Site avec plusieurs problèmes techniques (${count} point${count > 1 ? "s" : ""}).`,
  heuristicSummaryClean: "Site sans défaut critique évident détecté en analyse rapide.",
  heuristicNoCriticalIssue: "Aucun problème critique détecté par l'analyse heuristique.",
  claudeFallbackFailed: "Échec d'analyse IA, fallback heuristique utilisé.",
  claudeFallbackInvalid: "Réponse Claude invalide, fallback heuristique utilisé.",
  htmlUnavailableFallback: "HTML indisponible, fallback heuristique utilisé.",
  auditComplete: "Audit terminé.",
  manualReviewFallback: "Analyse rapide sans verdict explicite, examinez le site manuellement.",
};

export function getAuditMessages(locale: Locale): AuditMessages {
  return locale === "fr" ? FR_MESSAGES : EN_MESSAGES;
}

export function buildClaudeAuditPrompt(
  locale: Locale,
  websiteUrl: string,
  heuristicIssues: string[],
  htmlSnippet: string,
): string {
  const hints = heuristicIssues.join(" | ") || (locale === "fr" ? "Aucun" : "None");

  if (locale === "fr") {
    return `
Tu es un expert UI/UX et conversion qui audite des sites de TPE (restaurants, commerces, services) en France.
Un freelance web utilise ton analyse pour décider s'il prospecte : il a besoin de faits précis, pas de banalités.

Consignes pour le JSON :
- "summary" : une phrase percutante (≤ 140 caractères) qui résume le PROBLÈME principal côté client final (navigation, confiance, mobile, contenu, modernité). Évite les formulations vagues ("pourrait être amélioré").
- "issues" : 3 à 5 points CONCRETS en français, chacun relié à ce que tu vois dans l'HTML (structure, titres, images, formulaires, texte, accessibilité évidente). Pas de numérotation dans le texte du point. Pas de jargon inutile.
- Scores : sois exigeant. Un site moyen sans erreurs graves est souvent 45–60. Au-dessus de 75 seulement si le site est vraiment soigné et moderne.

Retourne STRICTEMENT un JSON valide (pas de markdown, pas de texte hors JSON) :
{
  "summary": "…",
  "design_score": number 0-100,
  "mobile_score": number 0-100,
  "trust_score": number 0-100,
  "global_score": number 0-100,
  "issues": ["…", "…"]
}

URL : ${websiteUrl}
Indices techniques automatiques : ${hints}
Extrait HTML :
${htmlSnippet}
`;
  }

  return `
You are a UI/UX and conversion expert auditing small business websites (restaurants, shops, local services).
A freelance web designer uses your analysis for prospecting: they need concrete facts, not generic fluff.

JSON instructions:
- "summary": one sharp sentence (≤ 140 characters) summarizing the main problem for end customers (navigation, trust, mobile, content, modernity). Avoid vague phrasing ("could be improved").
- "issues": 3 to 5 CONCRETE points in English, each tied to what you see in the HTML (structure, headings, images, forms, copy, obvious accessibility). No numbering inside each point. No useless jargon.
- Scores: be demanding. An average site without major flaws is often 45–60. Above 75 only if the site is genuinely polished and modern.

Return STRICTLY valid JSON (no markdown, no text outside JSON):
{
  "summary": "…",
  "design_score": number 0-100,
  "mobile_score": number 0-100,
  "trust_score": number 0-100,
  "global_score": number 0-100,
  "issues": ["…", "…"]
}

URL: ${websiteUrl}
Automatic technical hints: ${hints}
HTML excerpt:
${htmlSnippet}
`;
}
