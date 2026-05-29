import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-user";
import {
  inferBusinessTypeFromPages,
  inferBusinessTypeWithClaude,
  needsBusinessTypeInference,
  resolveBusinessTypeLabel,
} from "@/lib/business-type";
import { fetchWebsitePages } from "@/lib/contact-enrichment/fetch-pages";
import { getServerEnv } from "@/lib/env";
import { getServerLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;
    const locale = await getServerLocale();
    const t = createT(locale);

    const { data, error } = await supabase.from("prospects").select("*").eq("id", id).single();
    if (error || !data) {
      return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
    }

    const prospect = data as Prospect;
    const existingLabel = resolveBusinessTypeLabel(prospect, t);
    if (existingLabel && !needsBusinessTypeInference(prospect)) {
      return NextResponse.json({
        label: existingLabel,
        source: prospect.business_type_label ? "ai" : "google",
      });
    }
    if (prospect.business_type_label?.trim()) {
      return NextResponse.json({ label: prospect.business_type_label.trim(), source: "ai" });
    }

    let anthropicApiKey: string | undefined;
    try {
      anthropicApiKey = getServerEnv().ANTHROPIC_API_KEY;
    } catch {
      anthropicApiKey = undefined;
    }

    if (!anthropicApiKey) {
      return NextResponse.json({
        label: existingLabel,
        source: existingLabel ? "google" : null,
      });
    }

    const inferInput = {
      name: prospect.name,
      address: prospect.address,
      city: prospect.city,
      googleType: prospect.type,
      locale,
    };

    let label: string | null = null;
    if (prospect.website_url) {
      const pages = await fetchWebsitePages(prospect.website_url);
      label = await inferBusinessTypeFromPages(anthropicApiKey, inferInput, pages);
    }
    if (!label) {
      label = await inferBusinessTypeWithClaude(anthropicApiKey, inferInput);
    }

    if (label) {
      const { error: updateError } = await supabase
        .from("prospects")
        .update({ business_type_label: label })
        .eq("id", id);

      if (updateError && !/column.*business_type_label/i.test(updateError.message)) {
        return NextResponse.json({ error: "Impossible de sauvegarder le type." }, { status: 500 });
      }

      return NextResponse.json({ label, source: "ai" });
    }

    return NextResponse.json({
      label: existingLabel,
      source: existingLabel ? "google" : null,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
