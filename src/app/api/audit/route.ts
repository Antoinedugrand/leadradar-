import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireApiUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env";
import { parseLocale, type Locale } from "@/lib/i18n";
import {
  buildClaudeAuditPrompt,
  getAuditMessages,
  type AuditMessages,
} from "@/lib/website-fetch/audit-messages";
import { fetchPageSpeedScore } from "@/lib/website-fetch/pagespeed";
import { probeWebsite } from "@/lib/website-fetch/probe-website";

export const runtime = "nodejs";

const auditSchema = z.object({
  prospectId: z.string().uuid(),
  websiteUrl: z.string().url(),
  language: z.string().optional(),
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

function buildHeuristicIssues(
  html: string,
  websiteUrl: string,
  responseTimeMs: number,
  messages: AuditMessages,
): string[] {
  const hasViewport =
    /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html) ||
    /<meta[^>]+content=["'][^"']*width=device-width/i.test(html);
  const hasHttps = websiteUrl.startsWith("https://");
  const isLegacySite = inferLegacySite(html);
  const hasMetaDescription = /<meta[^>]+name=["']description["']/i.test(html);
  const hasOpenGraph = /<meta[^>]+property=["']og:/i.test(html);
  const tableCount = (html.match(/<table/gi) ?? []).length;
  const hasManyTables = tableCount >= 3;

  const heuristicIssues: string[] = [];
  if (!hasViewport) {
    heuristicIssues.push(messages.noViewport);
  }
  if (!hasHttps) {
    heuristicIssues.push(messages.noHttps);
  }
  if (responseTimeMs > 3000) {
    heuristicIssues.push(messages.slowLoad);
  }
  if (isLegacySite) {
    heuristicIssues.push(messages.legacySite);
  }
  if (!hasMetaDescription) {
    heuristicIssues.push(messages.noMetaDescription);
  }
  if (!hasOpenGraph) {
    heuristicIssues.push(messages.noOpenGraph);
  }
  if (hasManyTables) {
    heuristicIssues.push(messages.manyTables);
  }

  return heuristicIssues;
}

function buildHeuristicAudit(issues: string[], messages: AuditMessages): ClaudeAudit {
  const penalty = issues.length * 15;
  const globalScore = Math.max(20, 85 - penalty);

  return {
    summary:
      issues.length > 0
        ? messages.heuristicSummaryWithIssues(issues.length)
        : messages.heuristicSummaryClean,
    design_score: Math.max(20, globalScore - 5),
    mobile_score: Math.max(20, globalScore - (issues.some((v) => v.toLowerCase().includes("mobile")) ? 10 : 0)),
    trust_score: Math.max(20, globalScore - (issues.some((v) => v.toLowerCase().includes("https")) ? 12 : 0)),
    global_score: globalScore,
    issues: issues.length > 0 ? issues : [messages.heuristicNoCriticalIssue],
  };
}

function buildScreenshotUrl(websiteUrl: string): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(websiteUrl)}?w=1024&h=768`;
}

async function runClaudeAudit(
  anthropicApiKey: string,
  locale: Locale,
  websiteUrl: string,
  heuristicIssues: string[],
  htmlSnippet: string,
  messages: AuditMessages,
): Promise<{ parsed: ClaudeAudit | null; fallbackReason: string | null }> {
  const prompt = buildClaudeAuditPrompt(locale, websiteUrl, heuristicIssues, htmlSnippet);

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

  if (!anthropicResponse.ok) {
    return { parsed: null, fallbackReason: messages.claudeFallbackFailed };
  }

  const anthropicData = (await anthropicResponse.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const rawText = anthropicData.content?.find((item) => item.type === "text")?.text ?? "";
  const parsed = safeJsonParse<ClaudeAudit>(extractJsonPayload(rawText));

  if (!parsed) {
    return { parsed: null, fallbackReason: messages.claudeFallbackInvalid };
  }

  return { parsed, fallbackReason: null };
}

async function persistAudit(
  supabase: SupabaseClient,
  prospectId: string,
  payload: {
    audit_score: number;
    audit_summary: string;
    audit_issues: string[];
    screenshot_url: string;
  },
) {
  const { error: updateError } = await supabase
    .from("prospects")
    .update({
      website_exists: true,
      audit_score: payload.audit_score,
      audit_summary: payload.audit_summary,
      audit_issues: payload.audit_issues,
      screenshot_url: payload.screenshot_url,
      status: "audited",
    })
    .eq("id", prospectId);

  if (updateError) {
    const isMissingColumn = /column.*audit_summary/i.test(updateError.message);
    if (isMissingColumn) {
      await supabase
        .from("prospects")
        .update({
          website_exists: true,
          audit_score: payload.audit_score,
          audit_issues: payload.audit_issues,
          screenshot_url: payload.screenshot_url,
          status: "audited",
        })
        .eq("id", prospectId);
    } else {
      throw new Error("Audit fait, mais échec de mise à jour Supabase.");
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = auditSchema.parse(body);
    const locale = parseLocale(
      payload.language ?? new URL(request.url).searchParams.get("language"),
    );
    const messages = getAuditMessages(locale);
    const env = getServerEnv();
    const anthropicApiKey = env.ANTHROPIC_API_KEY;
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const screenshotUrl = buildScreenshotUrl(payload.websiteUrl);
    const probe = await probeWebsite(payload.websiteUrl);
    const probedUrl = probe.finalUrl || payload.websiteUrl;

    if (probe.reachability === "unreachable") {
      const summary = messages.serverUnreachable;
      const issues = [messages.serverUnreachableIssue];

      await persistAudit(supabase, payload.prospectId, {
        audit_score: 15,
        audit_summary: summary,
        audit_issues: issues,
        screenshot_url: screenshotUrl,
      });

      return NextResponse.json(
        {
          message: summary,
          summary,
          global_score: 15,
          issues,
          screenshot_url: screenshotUrl,
        },
        { status: 200 },
      );
    }

    const html = probe.html ?? "";
    const heuristicIssues = html
      ? buildHeuristicIssues(html, probedUrl, probe.responseTimeMs, messages)
      : [];

    if (probe.reachability === "blocked") {
      heuristicIssues.unshift(messages.blockedIssue(probe.status));
    }

    let parsed: ClaudeAudit | null = null;
    let fallbackReason: string | null = null;

    if (html.trim().length > 0) {
      const claude = await runClaudeAudit(
        anthropicApiKey,
        locale,
        probedUrl,
        heuristicIssues,
        html.slice(0, 16000),
        messages,
      );
      parsed = claude.parsed;
      fallbackReason = claude.fallbackReason;
    } else {
      fallbackReason = messages.htmlUnavailableFallback;
    }

    if (!parsed) {
      parsed = buildHeuristicAudit(heuristicIssues, messages);
    }

    if (probe.reachability === "blocked") {
      const pageSpeedScore = await fetchPageSpeedScore(probedUrl, env.GOOGLE_PLACES_API_KEY);
      if (pageSpeedScore !== null && pageSpeedScore < parsed.global_score) {
        parsed.global_score = Math.max(20, Math.min(parsed.global_score, pageSpeedScore + 10));
      }
      parsed.summary = messages.blockedByBot(probe.status);
      if (!parsed.issues.includes(messages.blockedIssue(probe.status))) {
        parsed.issues = [messages.blockedIssue(probe.status), ...parsed.issues].slice(0, 5);
      }
    }

    const summary = (parsed.summary ?? "").trim().slice(0, 240);
    const safeSummary =
      summary.length > 0 ? summary : heuristicIssues[0] ?? messages.manualReviewFallback;
    const mergedIssues = [...new Set([...(parsed.issues ?? []), ...heuristicIssues])].slice(0, 5);
    const boundedScore = Math.max(0, Math.min(100, Number(parsed.global_score) || 0));

    await persistAudit(supabase, payload.prospectId, {
      audit_score: boundedScore,
      audit_summary: safeSummary,
      audit_issues: mergedIssues,
      screenshot_url: screenshotUrl,
    });

    return NextResponse.json(
      {
        message: fallbackReason ?? messages.auditComplete,
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

    if (error instanceof Error && error.message.includes("Supabase")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Erreur serveur pendant l'audit." }, { status: 500 });
  }
}
