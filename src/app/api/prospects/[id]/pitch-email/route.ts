import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { parseLocale } from "@/lib/i18n";
import {
  assembleBodyWithIssues,
  buildPitchPrompt,
  fallbackPitch,
  pitchCacheKey,
  type ClaudePitchFull,
  type ClaudePitchSplit,
  type PitchEmail,
} from "@/lib/pitch-email/generate-pitch";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

const cache = new Map<string, { value: PitchEmail; expires: number }>();
const CACHE_MS = 20 * 60 * 1000;

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!enforceRateLimit("pitch-email")) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const idParse = z.string().uuid().safeParse((await context.params).id);
  if (!idParse.success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const locale = parseLocale(new URL(request.url).searchParams.get("language"));
  const id = idParse.data;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  }

  const prospect = data as Prospect;
  const key = pitchCacheKey(prospect, locale);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ ...hit.value, cached: true });
  }

  const issues = prospect.audit_issues ?? [];
  const { prompt, parseMode } = buildPitchPrompt(prospect, locale);

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
      pitch = fallbackPitch(prospect, locale);
      cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
      return NextResponse.json(pitch);
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
        pitch = fallbackPitch(prospect, locale);
        cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
        return NextResponse.json(pitch);
      }
      pitch = {
        subject: parsed.subject.trim(),
        body: assembleBodyWithIssues(
          parsed.before.trim().replace(/\\n/g, "\n"),
          issues,
          parsed.after.trim().replace(/\\n/g, "\n"),
          locale,
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
        pitch = fallbackPitch(prospect, locale);
        cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
        return NextResponse.json(pitch);
      }
      pitch = {
        subject: parsed.subject.trim(),
        body: parsed.body.trim().replace(/\\n/g, "\n"),
      };
    }
  } catch {
    pitch = fallbackPitch(prospect, locale);
    cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
    return NextResponse.json(pitch);
  }

  cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
  return NextResponse.json(pitch);
}
