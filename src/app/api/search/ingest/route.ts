import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

const prospectSchema = z.object({
  name: z.string().min(1),
  type: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable().optional(),
  website_url: z.string().nullable(),
  website_exists: z.boolean(),
  audit_score: z.number().nullable(),
  prospect_score: z.number().nullable(),
  score_breakdown: z.unknown().nullable(),
  score_label: z.string().nullable(),
  google_rating: z.number().nullable(),
  google_review_count: z.number().nullable(),
  audit_issues: z.unknown().nullable(),
  screenshot_url: z.string().nullable(),
  status: z.string(),
  google_place_id: z.string().min(1),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

const bodySchema = z.object({
  prospects: z.array(prospectSchema).min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = bodySchema.parse(body);
    const supabase = getSupabaseServerClient();

    const prospectsToSave = payload.prospects.map(({ lat: _lat, lng: _lng, ...save }) => ({
      ...save,
      email: save.email ?? null,
    }));

    const { error } = await supabase
      .from("prospects")
      .upsert(prospectsToSave, { onConflict: "google_place_id" });

    if (error) {
      return NextResponse.json({ error: "Erreur Supabase pendant la sauvegarde." }, { status: 500 });
    }

    const placeIds = prospectsToSave.map((item) => item.google_place_id);
    const { data: savedProspects, error: fetchError } = await supabase
      .from("prospects")
      .select("*")
      .in("google_place_id", placeIds)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: "Impossible de relire les prospects sauvegardés." }, { status: 500 });
    }

    const prospectsForList = (savedProspects ?? []) as Prospect[];
    const byPlaceId = new Map(
      prospectsForList.map((prospect) => [
        prospect.google_place_id,
        {
          audit_score: prospect.audit_score,
          prospect_score: prospect.prospect_score,
        },
      ]),
    );

    const data = payload.prospects.map((item) => {
      const scores = byPlaceId.get(item.google_place_id);
      return {
        google_place_id: item.google_place_id,
        name: item.name,
        address: item.address,
        website_url: item.website_url,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        audit_score: scores?.audit_score ?? null,
        prospect_score: scores?.prospect_score ?? null,
      };
    });

    return NextResponse.json({
      message: "Recherche zone terminée.",
      count: prospectsForList.length,
      data,
      prospects: prospectsForList,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalide.", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur ingestion recherche." }, { status: 500 });
  }
}
