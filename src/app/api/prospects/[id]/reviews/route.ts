import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { fetchAndAnalyzeReviews } from "@/lib/review-insights";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    if (!enforceRateLimit("google-places-reviews")) {
      return NextResponse.json({ error: "Limite de requêtes atteinte (10/s)." }, { status: 429 });
    }

    const { id } = await context.params;
    const env = getServerEnv();
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const { data, error } = await supabase.from("prospects").select("*").eq("id", id).single();
    if (error || !data) {
      return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
    }

    const prospect = data as Prospect;
    if (!prospect.google_place_id) {
      return NextResponse.json(
        { error: "Ce prospect n'a pas d'identifiant Google Places (relance une recherche)." },
        { status: 400 },
      );
    }

    const insights = await fetchAndAnalyzeReviews({
      googlePlaceId: prospect.google_place_id,
      prospectName: prospect.name,
      googleApiKey: env.GOOGLE_PLACES_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
    });

    const updates: Record<string, unknown> = {
      review_insights: insights,
    };
    if (insights.google_rating !== null) {
      updates.google_rating = insights.google_rating;
    }
    if (insights.google_review_count !== null) {
      updates.google_review_count = insights.google_review_count;
    }

    const { error: updateError } = await supabase.from("prospects").update(updates).eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: "Impossible de sauvegarder l'analyse des avis." }, { status: 500 });
    }

    return NextResponse.json({
      message: "Analyse des avis terminée.",
      review_insights: insights,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
