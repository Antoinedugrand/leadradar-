import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const idParse = z.string().uuid().safeParse((await context.params).id);
  if (!idParse.success) {
    return new NextResponse("Identifiant invalide.", { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("generated_site_html")
    .eq("id", idParse.data)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse("Maquette introuvable.", { status: 404 });
  }

  const html = (data as Pick<Prospect, "generated_site_html">).generated_site_html;
  if (!html) {
    return new NextResponse("Aucune maquette générée pour cet établissement.", { status: 404 });
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
