import { NextResponse } from "next/server";
import { z } from "zod";

import { mergeBusinessTypeLabel } from "@/lib/business-type";
import { enrichProspectsBatch, mergeContactFields } from "@/lib/contact-enrichment";
import { requireApiUser } from "@/lib/auth/require-user";
import { getServerLocale } from "@/lib/i18n/server";
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
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const { supabase, user } = auth;
    const body = await request.json();
    const payload = bodySchema.parse(body);

    const placeIds = payload.prospects.map((item) => item.google_place_id);
    const { data: existingRows } = await supabase
      .from("prospects")
      .select(
        "google_place_id, email, phone, email_source, phone_source, contacts_enriched_at, social_links, business_type_label",
      )
      .eq("user_id", user.id)
      .in("google_place_id", placeIds);

    const existingByPlaceId = new Map(
      (existingRows ?? []).map((row) => [row.google_place_id as string, row]),
    );

    const locale = await getServerLocale();

    const enrichInputs = payload.prospects.map((item) => ({
      businessName: item.name,
      websiteUrl: item.website_url,
      googlePhone: item.phone,
      google_place_id: item.google_place_id,
      googleType: item.type,
      address: item.address,
      city: item.city,
      existingBusinessTypeLabel: existingByPlaceId.get(item.google_place_id)?.business_type_label,
      locale,
    }));

    const enrichedByPlaceId = new Map(
      (await enrichProspectsBatch(enrichInputs)).map((item) => [item.google_place_id!, item]),
    );

    const prospectsToSave = payload.prospects.map(({ lat: _lat, lng: _lng, ...incoming }) => {
      const existing = existingByPlaceId.get(incoming.google_place_id);
      const enriched = enrichedByPlaceId.get(incoming.google_place_id);

      const merged = mergeContactFields(existing, {
        email: enriched?.email ?? incoming.email ?? null,
        phone: enriched?.phone ?? incoming.phone ?? null,
        email_source: enriched?.emailSource ?? null,
        phone_source:
          enriched?.phoneSource ?? (incoming.phone && !enriched ? "google" : null),
        contacts_enriched_at: enriched?.enrichedAt ?? null,
        social_links: enriched?.socialLinks?.length ? enriched.socialLinks : null,
      });

      return {
        ...incoming,
        user_id: user.id,
        email: merged.email ?? null,
        phone: merged.phone ?? null,
        email_source: merged.email_source ?? null,
        phone_source: merged.phone_source ?? null,
        contacts_enriched_at: merged.contacts_enriched_at ?? null,
        social_links: merged.social_links ?? null,
        business_type_label: mergeBusinessTypeLabel(existing, enriched?.businessTypeLabel),
      };
    });

    const { error } = await supabase
      .from("prospects")
      .upsert(prospectsToSave, { onConflict: "user_id,google_place_id" });

    if (error) {
      const isMissingColumn = /column.*(email_source|phone_source|contacts_enriched_at|social_links|business_type_label)/i.test(
        error.message,
      );
      if (isMissingColumn) {
        const fallbackRows = prospectsToSave.map(
          ({
            email_source: _es,
            phone_source: _ps,
            contacts_enriched_at: _ce,
            social_links: _sl,
            business_type_label: _bt,
            ...row
          }) => row,
        );
        const { error: fallbackError } = await supabase
          .from("prospects")
          .upsert(fallbackRows, { onConflict: "user_id,google_place_id" });
        if (fallbackError) {
          return NextResponse.json({ error: "Erreur Supabase pendant la sauvegarde." }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Erreur Supabase pendant la sauvegarde." }, { status: 500 });
      }
    }

    const { data: savedProspects, error: fetchError } = await supabase
      .from("prospects")
      .select("*")
      .eq("user_id", user.id)
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
