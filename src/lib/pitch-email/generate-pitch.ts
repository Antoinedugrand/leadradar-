import type { Locale } from "@/lib/i18n/types";
import type { Prospect } from "@/lib/types";

export interface PitchEmail {
  subject: string;
  body: string;
}

export interface ClaudePitchFull {
  subject: string;
  body: string;
}

export interface ClaudePitchSplit {
  subject: string;
  before: string;
  after: string;
}

export function pitchCacheKey(prospect: Prospect, locale: Locale): string {
  const issues = (prospect.audit_issues ?? []).join("||");
  const summary = (prospect.audit_summary ?? "").slice(0, 220);
  return `${locale}:${prospect.id}:${prospect.website_exists}:${prospect.audit_score ?? "na"}:${summary}:${issues.slice(0, 400)}`;
}

function normalizePlaceType(type: string | null, locale: Locale): string {
  if (!type) {
    return locale === "en" ? "business" : "établissement";
  }
  return type.replace(/_/g, " ");
}

export function assembleBodyWithIssues(
  before: string,
  issues: string[],
  after: string,
  locale: Locale,
): string {
  const list = issues.map((line, i) => `${i + 1}. ${line}`).join("\n");
  const trimmedBefore = before.trim();
  const trimmedAfter = after.trim();

  if (locale === "en") {
    return `${trimmedBefore}\n\nHere is what I noticed on your website:\n\n${list}\n\n${trimmedAfter}\n\nBest regards,\n[Your first name]`;
  }

  return `${trimmedBefore}\n\nVoici ce que j'ai relevé sur votre site :\n\n${list}\n\n${trimmedAfter}\n\nCordialement,\n[Votre prénom]`;
}

function fallbackPitchNoWebsite(prospect: Prospect, locale: Locale): PitchEmail {
  const name = prospect.name;
  const place = prospect.city ?? prospect.address ?? "";
  const type = normalizePlaceType(prospect.type, locale);
  const placeShort = place.split(",")[0]?.trim() ?? "";

  if (locale === "en") {
    const subject = placeShort
      ? `${name} — a simple website for ${placeShort}`
      : `${name} — your online presence`;
    const body = `Hello,\n\nI'm an independent web designer and I often come across great local businesses like ${name}${place ? ` (${place})` : ""}.\n\nI couldn't find an up-to-date website for you: for a ${type} like yours, a clear simple site (map, hours, menu or services, clickable phone number) really helps customers searching on their phone.\n\nIf you'd like, I can suggest a simple layout and a ballpark budget — happy to chat for 15 minutes with no obligation on your end.\n\nBest regards,\n[Your first name]`;
    return { subject, body };
  }

  const subject = placeShort
    ? `${name} — une vitrine web simple pour ${placeShort}`
    : `${name} — votre présence en ligne`;
  const body = `Bonjour,\n\nJe suis web indépendant et je repère souvent les bonnes adresses comme ${name}${place ? ` (${place})` : ""}.\n\nJe n'ai pas trouvé de site web à jour pour vous : pour ce type de ${type}, un petit site clair (carte, horaires, menu ou prestations, téléphone cliquable) aide vraiment les clients qui cherchent sur leur téléphone.\n\nSi vous voulez, je peux vous proposer un schéma simple et un budget indicatif — on peut en parler 15 minutes sans engagement de votre côté.\n\nCordialement,\n[Votre prénom]`;
  return { subject, body };
}

export function fallbackPitch(prospect: Prospect, locale: Locale): PitchEmail {
  if (!prospect.website_exists || !prospect.website_url) {
    return fallbackPitchNoWebsite(prospect, locale);
  }

  const name = prospect.name;
  const place = prospect.city ?? prospect.address ?? "";
  const type = prospect.type ?? "";
  const issues = prospect.audit_issues ?? [];
  const hasIssues = issues.length > 0;

  if (locale === "en") {
    const subject = place
      ? `${name} — a few ideas for your website (${place})`
      : `${name} — your website`;

    if (hasIssues) {
      const before = `Hello,\n\nI'm a freelance web designer. I took some time to browse ${name}'s website${place ? ` (${place})` : ""}${type ? ` — ${type.replace(/_/g, " ")}` : ""}. Here is what stood out from a visitor's perspective.`;
      const after = `Often these can be tackled step by step without rebuilding everything at once. If you want to prioritize what would help most, I'm happy to jump on a short call with no sales pressure.`;
      return { subject, body: assembleBodyWithIssues(before, issues, after, locale) };
    }

    const body = `Hello,\n\nI work with local businesses similar to ${name}${place ? ` (${place})` : ""} on their online presence.\n\nI don't have a detailed list of issues for your site yet: I can take a closer look and come back with 3 concrete ideas, if you're interested.\n\nWould you be open to a quick 10-minute call to see if it's a fit?\n\nBest regards,\n[Your first name]`;
    return { subject, body };
  }

  const subject = place
    ? `${name} — quelques pistes pour votre site (${place})`
    : `${name} — votre site web`;

  if (hasIssues) {
    const before = `Bonjour,\n\nJe vous écris en tant que freelance web : j'ai pris le temps de parcourir le site de ${name}${place ? ` (${place})` : ""}${type ? ` — ${type}` : ""}. Voici ce qui m'a semblé mériter un regard, côté expérience visiteur.`;
    const after = `Souvent, on peut traiter ça par étapes sans tout refaire d'un coup. Si vous voulez qu'on priorise ensemble ce qui rapporte le plus vite, je suis dispo pour un court appel, sans pression commerciale.`;
    return { subject, body: assembleBodyWithIssues(before, issues, after, locale) };
  }

  const body = `Bonjour,\n\nJe travaille avec des commerces et services du même acabit que ${name}${place ? ` (${place})` : ""} sur leur présence en ligne.\n\nJe n'ai pas encore de grille de points précis sur votre site : je peux regarder ça tranquillement et vous revenir avec 3 idées concrètes, si ça vous intéresse.\n\nOn peut s'appeler 10 minutes pour voir si ça colle avec ce que vous cherchez ?\n\nCordialement,\n[Votre prénom]`;
  return { subject, body };
}

function buildBaseFacts(prospect: Prospect, hasNoWebsite: boolean, locale: Locale): string {
  if (locale === "en") {
    return `
- Business name: ${prospect.name}
- Category: ${prospect.type ?? "not specified"}
- Address / city: ${prospect.address ?? "—"} ${prospect.city ?? ""}
- Website: ${hasNoWebsite ? "no website detected / no usable URL" : (prospect.website_url ?? "—")}
- Audit score (0-100, if any): ${prospect.audit_score ?? "not audited"}
- Audit summary (do not contradict; if "not audited", do not invent details): ${prospect.audit_summary ?? "—"}`;
  }

  return `
- Nom de l'établissement : ${prospect.name}
- Type / catégorie : ${prospect.type ?? "non renseigné"}
- Adresse / ville : ${prospect.address ?? "—"} ${prospect.city ?? ""}
- Site web : ${hasNoWebsite ? "aucun site web détecté / pas d'URL exploitable" : (prospect.website_url ?? "—")}
- Score audit (0-100, si présent) : ${prospect.audit_score ?? "non audité"}
- Synthèse audit (ne pas contredire ; si « non audité », ne pas inventer de détails) : ${prospect.audit_summary ?? "—"}`;
}

export function buildPitchPrompt(
  prospect: Prospect,
  locale: Locale,
): { prompt: string; parseMode: "split" | "full" } {
  const issues = prospect.audit_issues ?? [];
  const hasNoWebsite = !prospect.website_exists || !prospect.website_url;
  const baseFacts = buildBaseFacts(prospect, hasNoWebsite, locale);

  if (locale === "en") {
    if (hasNoWebsite) {
      return {
        parseMode: "full",
        prompt: `Write a B2B prospecting email in English for a freelance web designer (landing pages, light redesigns).

${baseFacts}

Context: no real website visible for this prospect. Never say you "visited their site" or "analyzed their pages". Stay factual: many customers search on Google Maps / phone.

Style: professional but warm, short sentences, direct tone (like an email to a local business owner). Avoid: "I hope this finds you well", "digital solutions", "synergy", "turnkey", "boost your visibility", "we partner with you".

Reply ONLY with this JSON (no markdown):
{"subject":"max 90 characters, include the business or area name","body":"Email 130-220 words. Start with Hello, then 2 paragraphs + one soft CTA (offer a 15-min call, no pressure). End with Best regards, then a line [Your first name]. Use \\n for line breaks."}`,
      };
    }

    if (issues.length > 0) {
      return {
        parseMode: "split",
        prompt: `Write a B2B prospecting email in English for an independent freelance web designer.

${baseFacts}

Issues spotted on the site (DO NOT copy them in your response; they will be inserted verbatim after your intro):
${issues.map((t, n) => `${n + 1}. ${t}`).join("\n")}

Style: warm, human, natural sentences. Avoid agency jargon.

Reply ONLY with this JSON (no markdown):
{"subject":"one concrete line with the business name","before":"After Hello, 2-4 sentences. Mention the exact name « ${prospect.name} », activity type and area if relevant. Say you browsed their site and what stood out overall (without listing the issues above). Use \\n for line breaks.","after":"2-4 sentences: why these points matter for customers, what you can do concretely, offer a short no-pressure call. No bullet list. No Best regards here. Use \\n if needed."}`,
      };
    }

    return {
      parseMode: "full",
      prompt: `Write a B2B prospecting email in English for an independent freelance web designer.

${baseFacts}

They have a site but the automatic audit has no issue list yet: do NOT invent specific technical problems. Talk about clarifying the offer, building trust, making the site easier on mobile.

Reply ONLY with this JSON:
{"subject":"personalized line with the name","body":"Full email: Hello, 2 short paragraphs, call-to-action. End with Best regards, then [Your first name]. Use \\n for line breaks."}`,
    };
  }

  if (hasNoWebsite) {
    return {
      parseMode: "full",
      prompt: `Tu rédiges un email de prospection B2B en français pour un freelance web (sites vitrines, refontes légères).

${baseFacts}

Contexte : pas de site web réellement visible pour ce prospect. Ne dis jamais que tu as « visité leur site » ou « analysé les pages ». Reste factuel : beaucoup de clients cherchent sur Google Maps / téléphone.

Style : vouvoiement, phrases un peu courtes, ton chaleureux et direct (comme un mail qu'on enverrait à un commerce du quartier). Évite absolument : « Je me permets », « solutions digitales », « expertise », « clé en main », « booster votre visibilité », « nous accompagnons ».

Réponds UNIQUEMENT avec ce JSON (pas de markdown) :
{"subject":"max 90 caractères, avec le nom du lieu ou de l'établissement","body":"Email 130 à 220 mots. Commence par Bonjour, puis 2 paragraphes + une phrase d'appel à l'action (proposition d'un appel de 15 min, sans pression). Termine par Cordialement, puis une ligne [Votre prénom]. Utilise \\n pour les sauts de ligne."}`,
    };
  }

  if (issues.length > 0) {
    return {
      parseMode: "split",
      prompt: `Tu rédiges un email de prospection B2B en français pour un freelance web indépendant en France.

${baseFacts}

Liste des points repérés sur le site (NE PAS les recopier dans ta réponse ; ils seront insérés tels quels après ton texte d'introduction) :
${issues.map((t, n) => `${n + 1}. ${t}`).join("\n")}

Consignes de style : vouvoiement, ton humain (bistro / commerce de proximité, pas pitch agence). Phrases naturelles. Évite : « Je me permets », « solutions digitales », « expertise », « clé en main », « nous vous accompagnons », « croissance ».

Réponds UNIQUEMENT avec ce JSON (pas de markdown) :
{"subject":"une ligne, concrète, avec le nom de l'établissement","before":"Après Bonjour, 2 à 4 phrases. Mentionne le nom exact « ${prospect.name} », le type d'activité et la zone si pertinent. Dis que tu as parcouru leur site et ce que tu en retiens globalement (sans lister les points ci-dessus). Utilise \\n pour les sauts de ligne.","after":"2 à 4 phrases : pourquoi ces points comptent pour leurs clients, ce que tu peux faire concrètement, proposition d'un appel court sans engagement. Pas de liste à puces. Pas Cordialement ici. Utilise \\n si besoin."}`,
    };
  }

  return {
    parseMode: "full",
    prompt: `Tu rédiges un email de prospection B2B en français pour un freelance web indépendant.

${baseFacts}

Il existe un site mais l'audit automatique n'a pas encore de liste de défauts : n'invente AUCUN problème technique précis. Parle plutôt de clarifier l'offre, rassurer le visiteur, rendre le site plus simple sur mobile.

Style : vouvoiement, ton direct et chaleureux. Évite le jargon marketing (voir liste dans l'autre prompt).

Réponds UNIQUEMENT avec ce JSON :
{"subject":"une ligne personnalisée avec le nom","body":"Email complet : Bonjour, développement en 2 courts paragraphes, proposition d'échange. Termine par Cordialement, puis [Votre prénom]. Utilise \\n pour les sauts de ligne."}`,
  };
}
