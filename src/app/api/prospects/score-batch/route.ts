import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env";
import { buildScoreUpdatePayload } from "@/lib/prospects/social-links-update";
import { ProspectScorer } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  prospectIds: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prospectIds } = bodySchema.parse(body);
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;
    const env = getServerEnv();
    const scorer = new ProspectScorer(env.GOOGLE_PLACES_API_KEY);

    const { data, error } = await supabase.from("prospects").select("*").in("id", prospectIds);
    if (error || !data?.length) {
      return NextResponse.json({ error: "Prospects introuvables." }, { status: 404 });
    }

    const prospects = data as Prospect[];
    const updatedIds: string[] = [];

    for (const prospect of prospects) {
      const result = await scorer.scoreProspect({
        websiteUrl: prospect.website_url,
        websiteExists: prospect.website_exists,
        googleReviewCount: prospect.google_review_count ?? null,
        googleRating: prospect.google_rating ?? null,
      });

      const updatePayload = buildScoreUpdatePayload(prospect, result);
      const { error: updateError } = await supabase
        .from("prospects")
        .update(updatePayload)
        .eq("id", prospect.id);

      if (!updateError) {
        updatedIds.push(prospect.id);
        continue;
      }

      const isMissingColumn = /column.*social_links/i.test(updateError.message);
      if (isMissingColumn) {
        const { social_links: _sl, ...fallbackPayload } = updatePayload;
        const { error: fallbackError } = await supabase
          .from("prospects")
          .update(fallbackPayload)
          .eq("id", prospect.id);
        if (!fallbackError) {
          updatedIds.push(prospect.id);
        }
      }
    }

    const { data: refreshed, error: fetchError } = await supabase
      .from("prospects")
      .select("*")
      .in("id", prospectIds);

    if (fetchError || !refreshed) {
      return NextResponse.json({ error: "Impossible de relire les prospects scorés." }, { status: 500 });
    }

    return NextResponse.json({
      scored: updatedIds.length,
      prospects: refreshed as Prospect[],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalide.", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur scoring batch." }, { status: 500 });
  }
}
