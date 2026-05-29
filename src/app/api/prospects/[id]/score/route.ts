import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env";
import { buildScoreUpdatePayload } from "@/lib/prospects/social-links-update";
import { ProspectScorer } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;
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

    const updatePayload = buildScoreUpdatePayload(prospect, result);

    const { error: updateError } = await supabase.from("prospects").update(updatePayload).eq("id", id);

    if (updateError) {
      const isMissingColumn = /column.*social_links/i.test(updateError.message);
      if (isMissingColumn) {
        const { social_links: _sl, ...fallbackPayload } = updatePayload;
        const { error: fallbackError } = await supabase
          .from("prospects")
          .update(fallbackPayload)
          .eq("id", id);
        if (fallbackError) {
          return NextResponse.json({ error: "Impossible de sauvegarder le score." }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Impossible de sauvegarder le score." }, { status: 500 });
      }
    }

    return NextResponse.json({
      prospectId: id,
      ...result,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur scoring." }, { status: 500 });
  }
}
