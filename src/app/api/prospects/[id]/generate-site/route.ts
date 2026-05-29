import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateProspectSite } from "@/lib/site-generator/generate-prospect-site";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function demoUrl(prospectId: string, request: Request): string {
  const origin = new URL(request.url).origin;
  return `${origin}/demo/${prospectId}`;
}

function hasNoWebsite(prospect: Prospect): boolean {
  return !prospect.website_exists || !prospect.website_url;
}

export async function GET(request: Request, context: RouteContext) {
  const idParse = z.string().uuid().safeParse((await context.params).id);
  if (!idParse.success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { data, error } = await supabase
    .from("prospects")
    .select("id, generated_site_html, generated_site_at, website_exists, website_url")
    .eq("id", idParse.data)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  }

  const prospect = data as Pick<
    Prospect,
    "id" | "generated_site_html" | "generated_site_at" | "website_exists" | "website_url"
  >;

  if (!hasNoWebsite(prospect as Prospect)) {
    return NextResponse.json(
      { error: "La génération de site est réservée aux établissements sans site web." },
      { status: 400 },
    );
  }

  if (!prospect.generated_site_html) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    previewUrl: demoUrl(prospect.id, request),
    generatedAt: prospect.generated_site_at,
  });
}

export async function POST(request: Request, context: RouteContext) {
  if (!enforceRateLimit("generate-site")) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const idParse = z.string().uuid().safeParse((await context.params).id);
  if (!idParse.success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  let regenerate = false;
  try {
    const body = (await request.json()) as { regenerate?: boolean };
    regenerate = Boolean(body.regenerate);
  } catch {
    regenerate = false;
  }

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { data, error } = await supabase.from("prospects").select("*").eq("id", idParse.data).maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  }

  const prospect = data as Prospect;

  if (!hasNoWebsite(prospect)) {
    return NextResponse.json(
      { error: "La génération de site est réservée aux établissements sans site web." },
      { status: 400 },
    );
  }

  if (prospect.generated_site_html && !regenerate) {
    return NextResponse.json({
      previewUrl: demoUrl(prospect.id, request),
      cached: true,
      generatedAt: prospect.generated_site_at,
    });
  }

  const generated = await generateProspectSite(prospect);
  const generatedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("prospects")
    .update({
      generated_site_html: generated.html,
      generated_site_at: generatedAt,
    })
    .eq("id", prospect.id);

  if (updateError) {
    const isMissingColumn = /column.*generated_site/i.test(updateError.message);
    if (isMissingColumn) {
      return NextResponse.json(
        {
          error:
            "Colonne generated_site_html absente en base. Appliquez la migration supabase/migrations/0005_generated_site.sql.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Impossible d'enregistrer la maquette générée." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    previewUrl: demoUrl(prospect.id, request),
    cached: false,
    fallback: generated.fallback,
    generatedAt,
  });
}
