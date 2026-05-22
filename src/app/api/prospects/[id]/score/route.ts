import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { ProspectScorer } from "@/lib/prospect-scorer";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();
    const env = getServerEnv();

    const { data, error } = await supabase.from("prospects").select("*").eq("id", id).single();
    if (error || !data) {
      return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
    }

    const prospect = data as Prospect;
    const scorer = new ProspectScorer(env.GOOGLE_PLACES_API_KEY);
    const result = await scorer.scoreProspect({
      websiteUrl: prospect.website_url,
      websiteExists: prospect.website_exists,
      googleReviewCount: prospect.google_review_count ?? null,
      googleRating: prospect.google_rating ?? null,
    });

    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        prospect_score: result.score,
        score_breakdown: result.breakdown,
        score_label: result.label,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Impossible de sauvegarder le score." }, { status: 500 });
    }

    return NextResponse.json({
      prospectId: id,
      ...result,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur scoring." }, { status: 500 });
  }
}
