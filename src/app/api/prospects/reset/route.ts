import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

const schema = z.object({
  scope: z.enum(["active", "contacted"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scope } = schema.parse(body);

    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    if (scope === "active") {
      const { error, count } = await supabase
        .from("prospects")
        .delete({ count: "exact" })
        .in("status", ["new", "audited"]);

      if (error) {
        return NextResponse.json(
          { error: "Impossible de réinitialiser la liste des prospects." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Liste des prospects réinitialisée.",
        count: count ?? 0,
      });
    }

    const { error, count } = await supabase
      .from("prospects")
      .update({
        status: "audited",
        contact_pipeline: null,
        emailed_at: null,
      })
      .in("status", ["emailed", "replied", "converted"])
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { error: "Impossible de réinitialiser la liste des contactés." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Liste des contactés réinitialisée.",
      count: count ?? 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalide.", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
