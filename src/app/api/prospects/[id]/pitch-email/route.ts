import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env";
import { parseLocale, type Locale } from "@/lib/i18n";
import {
  assembleBodyWithIssues,
  buildPitchPrompt,
  fallbackPitch,
  pickRegenerateAngle,
  pitchCacheKey,
  type ClaudePitchFull,
  type ClaudePitchSplit,
  type PitchAngle,
  type PitchEmail,
} from "@/lib/pitch-email/generate-pitch";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

const cache = new Map<string, { value: PitchEmail; expires: number }>();
const CACHE_MS = 20 * 60 * 1000;

const pitchAngleSchema = z.enum(["direct", "warm", "short"]);

export interface PitchEmailResponse extends PitchEmail {
  cached?: boolean;
  fallback?: boolean;
  angle?: PitchAngle;
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

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadProspect(
  supabase: SupabaseClient,
  id: string,
): Promise<{ prospect: Prospect } | { error: string; status: number }> {
  const { data, error } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return { error: "Prospect introuvable.", status: 404 };
  }

  return { prospect: data as Prospect };
}

async function generatePitchEmail(
  prospect: Prospect,
  locale: Locale,
  angle: PitchAngle = "default",
): Promise<{ pitch: PitchEmail; fallback: boolean }> {
  const issues = prospect.audit_issues ?? [];
  const { prompt, parseMode } = buildPitchPrompt(prospect, locale, angle);

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
      return { pitch: fallbackPitch(prospect, locale), fallback: true };
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
        return { pitch: fallbackPitch(prospect, locale), fallback: true };
      }

      return {
        pitch: {
          subject: parsed.subject.trim(),
          body: assembleBodyWithIssues(
            parsed.before.trim().replace(/\\n/g, "\n"),
            issues,
            parsed.after.trim().replace(/\\n/g, "\n"),
            locale,
          ),
        },
        fallback: false,
      };
    }

    const parsed = safeJsonParse<ClaudePitchFull>(raw);
    if (
      !parsed ||
      typeof parsed.subject !== "string" ||
      typeof parsed.body !== "string" ||
      parsed.subject.length < 3 ||
      parsed.body.length < 20
    ) {
      return { pitch: fallbackPitch(prospect, locale), fallback: true };
    }

    return {
      pitch: {
        subject: parsed.subject.trim(),
        body: parsed.body.trim().replace(/\\n/g, "\n"),
      },
      fallback: false,
    };
  } catch {
    return { pitch: fallbackPitch(prospect, locale), fallback: true };
  }
}

function cachePitch(prospect: Prospect, locale: Locale, angle: PitchAngle, pitch: PitchEmail): void {
  const key = pitchCacheKey(prospect, locale, angle);
  cache.set(key, { value: pitch, expires: Date.now() + CACHE_MS });
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
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const loaded = await loadProspect(auth.supabase, idParse.data);
  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const { prospect } = loaded;
  const angle: PitchAngle = "default";
  const key = pitchCacheKey(prospect, locale, angle);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ ...hit.value, cached: true, angle } satisfies PitchEmailResponse);
  }

  const { pitch, fallback } = await generatePitchEmail(prospect, locale, angle);
  cachePitch(prospect, locale, angle, pitch);

  return NextResponse.json({ ...pitch, fallback, angle } satisfies PitchEmailResponse);
}

export async function POST(request: Request, context: RouteContext) {
  if (!enforceRateLimit("pitch-email")) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const idParse = z.string().uuid().safeParse((await context.params).id);
  if (!idParse.success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  let regenerate = false;
  let useAuditContext = false;
  let requestedAngle: Exclude<PitchAngle, "default"> | undefined;

  try {
    const body = (await request.json()) as {
      regenerate?: boolean;
      useAuditContext?: boolean;
      angle?: string;
      language?: string;
    };
    regenerate = Boolean(body.regenerate);
    useAuditContext = Boolean(body.useAuditContext);
    const angleParse = pitchAngleSchema.safeParse(body.angle);
    if (angleParse.success) {
      requestedAngle = angleParse.data;
    }
  } catch {
    regenerate = false;
  }

  if (!regenerate) {
    return NextResponse.json({ error: "Régénération requise." }, { status: 400 });
  }

  const locale = parseLocale(new URL(request.url).searchParams.get("language"));
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const loaded = await loadProspect(auth.supabase, idParse.data);
  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const { prospect } = loaded;
  const angle: PitchAngle = useAuditContext ? "default" : (requestedAngle ?? pickRegenerateAngle());
  const { pitch, fallback } = await generatePitchEmail(prospect, locale, angle);
  cachePitch(prospect, locale, angle, pitch);

  return NextResponse.json({ ...pitch, fallback, angle } satisfies PitchEmailResponse);
}
