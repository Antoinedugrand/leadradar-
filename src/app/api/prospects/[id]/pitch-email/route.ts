import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

interface PitchEmail {
  subject: string;
  body: string;
}

interface ClaudePitchFull {
  subject: string;
  body: string;
}

/** Avec points d'audit : intro / conclusion sans recopier la liste (insérée telle quelle au milieu). */
interface ClaudePitchSplit {
  subject: string;
  before: string;
  after: string;
}

const cache = new Map<string, { value: PitchEmail; expires: number }>();
const CACHE_MS = 20 * 60 * 1000;

function cacheKey(prospect: Prospect): string {
  const issues = (prospect.audit_issues ?? []).join("||");
  const summary = (prospect.audit_summary ?? "").slice(0, 220);
  return `${prospect.id}:${prospect.website_exists}:${prospect.audit_score ?? "na"}:${summary}:${issues.slice(0, 400)}`;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

function verbatimIssuesBlock(issues: string[]): string {
  return issues.map((line, i) => `${i + 1}. ${line}`).join("\n");
}

function assembleBodyWithIssues(before: string, issues: string[], after: string): string {
  const list = verbatimIssuesBlock(issues);
  const trimmedBefore = before.trim();
  const trimmedAfter = after.trim();
  return `${trimmedBefore}\n\nVoici ce que j'ai relevé sur votre site :\n\n${list}\n\n${trimmedAfter}\n\nCordialement,\n[Votre prénom]`;
}

function fallbackPitchNoWebsite(prospect: Prospect): PitchEmail {
  const name = prospect.name;
  const place = prospect.city ?? prospect.address ?? "";
  const type = prospect.type ?? "établissement";
  const subject = place
    ? `${name} — une vitrine web simple pour ${place.split(",")[0]?.trim() ?? "votre zone"}`
    : `${name} — votre présence en ligne`;
  const body = `Bonjour,\n\nJe suis web indépendant et je repère souvent les bonnes adresses comme ${name}${place ? ` (${place})` : ""}.\n\nJe n'ai pas trouvé de site web à jour pour vous : pour ce type de ${type}, un petit site clair (carte, horaires, menu ou prestations, téléphone cliquable) aide vraiment les clients qui cherchent sur leur téléphone.\n\nSi vous voulez, je peux vous proposer un schéma simple et un budget indicatif — on peut en parler 15 minutes sans engagement de votre côté.\n\nCordialement,\n[Votre prénom]`;
  return { subject, body };
}

function fallbackPitch(prospect: Prospect): PitchEmail {
  if (!prospect.website_exists || !prospect.website_url) {
    return fallbackPitchNoWebsite(prospect);
  }

  const name = prospect.name;
  const place = prospect.city ?? prospect.address ?? "";
  const type = prospect.type ?? "";
  const issues = prospect.audit_issues ?? [];
  const hasIssues = issues.length > 0;

  const subject = place
    ? `${name} — quelques pistes pour votre site (${place})`
    : `${name} — votre site web`;

  if (hasIssues) {
    const before = `Bonjour,\n\nJe vous écris en tant que freelance web : j'ai pris le temps de parcourir le site de ${name}${place ? ` (${place})` : ""}${type ? ` — ${type}` : ""}. Voici ce qui m'a semblé mériter un regard, côté expérience visiteur.`;
    const after = `Souvent, on peut traiter ça par étapes sans tout refaire d'un coup. Si vous voulez qu'on priorise ensemble ce qui rapporte le plus vite, je suis dispo pour un court appel, sans pression commerciale.`;
    return { subject, body: assembleBodyWithIssues(before, issues, after) };
  }

  const body = `Bonjour,\n\nJe travaille avec des commerces et services du même acabit que ${name}${place ? ` (${place})` : ""} sur leur présence en ligne.\n\nJe n'ai pas encore de grille de points précis sur votre site : je peux regarder ça tranquillement et vous revenir avec 3 idées concrètes, si ça vous intéresse.\n\nOn peut s'appeler 10 minutes pour voir si ça colle avec ce que vous cherchez ?\n\nCordialement,\n[Votre prénom]`;

  return { subject, body };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!enforceRateLimit("pitch-email")) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const idParse = z.string().uuid().safeParse((await context.params).id);
  if (!idParse.success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const id = idParse.data;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  }

  const prospect = data as Prospect;
  const key = cacheKey(prospect);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ ...hit.value, cached: true });
  }

  const issues = prospect.audit_issues ?? [];
  const hasNoWebsite = !prospect.website_exists || !prospect.website_url;

  const baseFacts = `
- Nom de l'établissement : ${prospect.name}
- Type / catégorie : ${prospect.type ?? "non renseigné"}
- Adresse / ville : ${prospect.address ?? "—"} ${prospect.city ?? ""}
- Site web : ${hasNoWebsite ? "aucun site web détecté / pas d'URL exploitable" : (prospect.website_url ?? "—")}
- Score audit (0-100, si présent) : ${prospect.audit_score ?? "non audité"}
- Synthèse audit (ne pas contredire ; si « non audité », ne pas inventer de détails) : ${prospect.audit_summary ?? "—"}`;

  const promptNoWebsite = `Tu rédiges un email de prospection B2B en français pour un freelance web (sites vitrines, refontes légères).

${baseFacts}

Contexte : pas de site web réellement visible pour ce prospect. Ne dis jamais que tu as « visité leur site » ou « analysé les pages ». Reste factuel : beaucoup de clients cherchent sur Google Maps / téléphone.

Style : vouvoiement, phrases un peu courtes, ton chaleureux et direct (comme un mail qu'on enverrait à un commerce du quartier). Évite absolument : « Je me permets », « solutions digitales », « expertise », « clé en main », « booster votre visibilité », « nous accompagnons ».

Réponds UNIQUEMENT avec ce JSON (pas de markdown) :
{"subject":"max 90 caractères, avec le nom du lieu ou de l'établissement","body":"Email 130 à 220 mots. Commence par Bonjour, puis 2 paragraphes + une phrase d'appel à l'action (proposition d'un appel de 15 min, sans pression). Termine par Cordialement, puis une ligne [Votre prénom]. Utilise \\n pour les sauts de ligne."}`;

  const promptWithIssues = `Tu rédiges un email de prospection B2B en français pour un freelance web indépendant en France.

${baseFacts}

Liste des points repérés sur le site (NE PAS les recopier dans ta réponse ; ils seront insérés tels quels après ton texte d'introduction) :
${issues.map((t, n) => `${n + 1}. ${t}`).join("\n")}

Consignes de style : vouvoiement, ton humain (bistro / commerce de proximité, pas pitch agence). Phrases naturelles. Évite : « Je me permets », « solutions digitales », « expertise », « clé en main », « nous vous accompagnons », « croissance ».

Réponds UNIQUEMENT avec ce JSON (pas de markdown) :
{"subject":"une ligne, concrète, avec le nom de l'établissement","before":"Après Bonjour, 2 à 4 phrases. Mentionne le nom exact « ${prospect.name} », le type d'activité et la zone si pertinent. Dis que tu as parcouru leur site et ce que tu en retiens globalement (sans lister les points ci-dessus). Utilise \\n pour les sauts de ligne.","after":"2 à 4 phrases : pourquoi ces points comptent pour leurs clients, ce que tu peux faire concrètement, proposition d'un appel court sans engagement. Pas de liste à puces. Pas Cordialement ici. Utilise \\n si besoin."}`;

  const promptNoIssues = `Tu rédiges un email de prospection B2B en français pour un freelance web indépendant.

${baseFacts}

Il existe un site mais l'audit automatique n'a pas encore de liste de défauts : n'invente AUCUN problème technique précis. Parle plutôt de clarifier l'offre, rassurer le visiteur, rendre le site plus simple sur mobile.

Style : vouvoiement, ton direct et chaleureux. Évite le jargon marketing (voir liste dans l'autre prompt).

Réponds UNIQUEMENT avec ce JSON :
{"subject":"une ligne personnalisée avec le nom","body":"Email complet : Bonjour, développement en 2 courts paragraphes, proposition d'échange. Termine par Cordialement, puis [Votre prénom]. Utilise \\n pour les sauts de ligne."}`;

  type ParseMode = "split" | "full";
  let prompt: string;
  let parseMode: ParseMode;

  if (hasNoWebsite) {
    prompt = promptNoWebsite;
    parseMode = "full";
  } else if (issues.length > 0) {
    prompt = promptWithIssues;
    parseMode = "split";
  } else {
    prompt = promptNoIssues;
    parseMode = "full";
  }

  let pitch: PitchEmail;

  try {
    const env = getServerEnv();
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      pitch = fallbackPitch(prospect);
      cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
      return NextResponse.json({ ...pitch, fallback: true });
    }

    const anthropicData = (await anthropicResponse.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const rawText = anthropicData.content?.find((item) => item.type === "text")?.text ?? "";
    const raw = extractJsonPayload(rawText);

    if (parseMode === "split") {
      const parsed = safeJsonParse<ClaudePitchSplit>(raw);
      if (
        !parsed ||
        typeof parsed.subject !== "string" ||
        typeof parsed.before !== "string" ||
        typeof parsed.after !== "string" ||
        parsed.subject.length < 3 ||
        parsed.before.length < 15 ||
        parsed.after.length < 15
      ) {
        pitch = fallbackPitch(prospect);
        cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
        return NextResponse.json({ ...pitch, fallback: true });
      }
      pitch = {
        subject: parsed.subject.trim(),
        body: assembleBodyWithIssues(
          parsed.before.trim().replace(/\\n/g, "\n"),
          issues,
          parsed.after.trim().replace(/\\n/g, "\n"),
        ),
      };
    } else {
      const parsed = safeJsonParse<ClaudePitchFull>(raw);
      if (
        !parsed ||
        typeof parsed.subject !== "string" ||
        typeof parsed.body !== "string" ||
        parsed.subject.length < 3 ||
        parsed.body.length < 20
      ) {
        pitch = fallbackPitch(prospect);
        cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
        return NextResponse.json({ ...pitch, fallback: true });
      }
      pitch = {
        subject: parsed.subject.trim(),
        body: parsed.body.trim().replace(/\\n/g, "\n"),
      };
    }
  } catch {
    pitch = fallbackPitch(prospect);
    cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
    return NextResponse.json({ ...pitch, fallback: true });
  }

  cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
  return NextResponse.json(pitch);
}
