import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProspectStatus } from "@/lib/types";

export const runtime = "nodejs";

const schema = z.object({
  contacted: z.boolean(),
  currentStatus: z.enum(["new", "audited", "emailed", "replied", "converted"]),
  fallbackStatus: z.enum(["new", "audited", "emailed", "replied", "converted"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);
    const { id } = await context.params;

    const wasInContactedGroup =
      payload.currentStatus === "emailed" ||
      payload.currentStatus === "replied" ||
      payload.currentStatus === "converted";

    let nextStatus: ProspectStatus = payload.currentStatus;

    if (payload.contacted) {
      if (payload.currentStatus === "new" || payload.currentStatus === "audited") {
        nextStatus = "emailed";
      }
    } else if (wasInContactedGroup) {
      nextStatus = payload.fallbackStatus;
    }

    const updates: Record<string, unknown> = {
      status: nextStatus,
      contact_pipeline: payload.contacted ? "waiting_reply" : null,
    };

    if (payload.contacted && (payload.currentStatus === "new" || payload.currentStatus === "audited")) {
      updates.emailed_at = new Date().toISOString();
    } else if (!payload.contacted) {
      updates.emailed_at = null;
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("prospects").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Impossible de mettre à jour le statut contacté." }, { status: 500 });
    }

    return NextResponse.json({ message: "Statut contacté mis à jour." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalide.", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
