import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const auditSchema = z.object({
  prospectId: z.string().uuid(),
  websiteUrl: z.string().url(),
});

interface ClaudeAudit {
  summary: string;
  design_score: number;
  mobile_score: number;
  trust_score: number;
  global_score: number;
  issues: string[];
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

function inferLegacySite(html: string): boolean {
  const yearMatch = html.match(/(?:copyright|©)\s*(\d{4})/i);
  if (!yearMatch?.[1]) {
    return false;
  }
  const year = Number(yearMatch[1]);
  return Number.isFinite(year) && year < 2015;
}

function buildHeuristicAudit(issues: string[]): ClaudeAudit {
  const penalty = issues.length * 15;
  const globalScore = Math.max(20, 85 - penalty);

  return {
    summary:
      issues.length > 0
        ? `Site avec plusieurs problèmes techniques (${issues.length} point${issues.length > 1 ? "s" : ""}).`
        : "Site sans défaut critique évident détecté en analyse rapide.",
    design_score: Math.max(20, globalScore - 5),
    mobile_score: Math.max(20, globalScore - (issues.some((v) => v.includes("mobile")) ? 10 : 0)),
    trust_score: Math.max(20, globalScore - (issues.some((v) => v.includes("HTTPS")) ? 12 : 0)),
    global_score: globalScore,
    issues: issues.length > 0 ? issues : ["Aucun problème critique détecté par l'analyse heuristique."],
  };
}

function buildScreenshotUrl(websiteUrl: string): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(websiteUrl)}?w=1024&h=768`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = auditSchema.parse(body);
    const env = getServerEnv();
    const anthropicApiKey = env.ANTHROPIC_API_KEY;
    const supabase = getSupabaseServerClient();

    const screenshotUrl = buildScreenshotUrl(payload.websiteUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const startedAt = performance.now();

    let websiteResponse: Response;
    try {
      websiteResponse = await fetch(payload.websiteUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "LeadSiteBot/1.0 (+https://leadsite.local)" },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!websiteResponse.ok) {
      await supabase
        .from("prospects")
        .update({
          website_exists: false,
          status: "audited",
          audit_score: 0,
          audit_summary: "Site inaccessible (réponse HTTP invalide).",
          audit_issues: ["Site inaccessible (HTTP non valide)."],
          screenshot_url: screenshotUrl,
        })
        .eq("id", payload.prospectId);

      return NextResponse.json(
        {
          message: "Site inaccessible.",
          summary: "Site inaccessible (réponse HTTP invalide).",
          global_score: 0,
          issues: ["Site inaccessible."],
          screenshot_url: screenshotUrl,
        },
        { status: 200 },
      );
    }

    const responseTimeMs = performance.now() - startedAt;
    const html = await websiteResponse.text();
    const hasViewport =
      /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html) ||
      /<meta[^>]+content=["'][^"']*width=device-width/i.test(html);
    const hasHttps = payload.websiteUrl.startsWith("https://");
    const isLegacySite = inferLegacySite(html);

    const hasMetaDescription = /<meta[^>]+name=["']description["']/i.test(html);
    const hasOpenGraph = /<meta[^>]+property=["']og:/i.test(html);
    const tableCount = (html.match(/<table/gi) ?? []).length;
    const hasManyTables = tableCount >= 3;

    const heuristicIssues: string[] = [];
    if (!hasViewport) {
      heuristicIssues.push("Le site semble peu adapté mobile (meta viewport absente).");
    }
    if (!hasHttps) {
      heuristicIssues.push("Le site n'utilise pas HTTPS.");
    }
    if (responseTimeMs > 3000) {
      heuristicIssues.push("Le temps de chargement semble lent.");
    }
    if (isLegacySite) {
      heuristicIssues.push("Le site semble ancien (indices antérieurs à 2015).");
    }
    if (!hasMetaDescription) {
      heuristicIssues.push("Meta description absente ou peu exploitable pour le SEO.");
    }
    if (!hasOpenGraph) {
      heuristicIssues.push("Pas de balisage Open Graph (aperçu partage réseaux souvent médiocre).");
    }
    if (hasManyTables) {
      heuristicIssues.push("Mise en page très tabulaire (souvent signe d'un site daté).");
    }

    const htmlSnippet = html.slice(0, 16000);
    const prompt = `
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

URL : ${payload.websiteUrl}
Indices techniques automatiques : ${heuristicIssues.join(" | ") || "Aucun"}
Extrait HTML :
${htmlSnippet}
`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1100,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    let parsed: ClaudeAudit | null = null;
    let fallbackReason: string | null = null;

    if (!anthropicResponse.ok) {
      fallbackReason = "Échec d'analyse IA, fallback heuristique utilisé.";
    } else {
      const anthropicData = (await anthropicResponse.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const rawText = anthropicData.content?.find((item) => item.type === "text")?.text ?? "";
      parsed = safeJsonParse<ClaudeAudit>(extractJsonPayload(rawText));
      if (!parsed) {
        fallbackReason = "Réponse Claude invalide, fallback heuristique utilisé.";
      }
    }

    if (!parsed) {
      parsed = buildHeuristicAudit(heuristicIssues);
    }

    const summary = (parsed.summary ?? "").trim().slice(0, 240);
    const safeSummary =
      summary.length > 0
        ? summary
        : heuristicIssues[0] ??
          "Analyse rapide sans verdict explicite, examinez le site manuellement.";
    const mergedIssues = [...new Set([...(parsed.issues ?? []), ...heuristicIssues])].slice(0, 5);
    const boundedScore = Math.max(0, Math.min(100, Number(parsed.global_score) || 0));

    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        website_exists: true,
        audit_score: boundedScore,
        audit_summary: safeSummary,
        audit_issues: mergedIssues,
        screenshot_url: screenshotUrl,
        status: "audited",
      })
      .eq("id", payload.prospectId);

    if (updateError) {
      // Si la colonne audit_summary n'existe pas encore en DB, on retombe sans elle
      const isMissingColumn = /column.*audit_summary/i.test(updateError.message);
      if (isMissingColumn) {
        await supabase
          .from("prospects")
          .update({
            website_exists: true,
            audit_score: boundedScore,
            audit_issues: mergedIssues,
            screenshot_url: screenshotUrl,
            status: "audited",
          })
          .eq("id", payload.prospectId);
      } else {
        return NextResponse.json(
          { error: "Audit fait, mais échec de mise à jour Supabase." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        message: fallbackReason ?? "Audit terminé.",
        summary: safeSummary,
        design_score: parsed.design_score,
        mobile_score: parsed.mobile_score,
        trust_score: parsed.trust_score,
        global_score: boundedScore,
        issues: mergedIssues,
        screenshot_url: screenshotUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Requête invalide.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Erreur serveur pendant l'audit." }, { status: 500 });
  }
}
