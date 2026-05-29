import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import type { ProspectStatus } from "@/lib/types";

export const runtime = "nodejs";

const schema = z.object({
  pipeline: z.enum(["waiting_reply", "project_done"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

const CONTACTED_STATUSES: ProspectStatus[] = ["emailed", "replied", "converted"];

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const { pipeline } = schema.parse(body);
    const { id } = await context.params;

    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;
    const { data: row, error: fetchError } = await supabase
      .from("prospects")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
    }

    const status = row.status as ProspectStatus;
    if (!CONTACTED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Ce prospect n'est pas marqué comme contacté." },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("prospects").update({ contact_pipeline: pipeline }).eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
    }

    return NextResponse.json({ message: "Suivi mis à jour.", pipeline });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
