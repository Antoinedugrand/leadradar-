import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["new", "audited", "emailed", "replied", "converted"]).optional(),
  type: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload = querySchema.parse({
      page: searchParams.get("page") ?? 1,
      pageSize: searchParams.get("pageSize") ?? 20,
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
    });

    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;
    const from = (payload.page - 1) * payload.pageSize;
    const to = from + payload.pageSize - 1;

    let query = supabase
      .from("prospects")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (payload.status) {
      query = query.eq("status", payload.status);
    }
    if (payload.type) {
      query = query.ilike("type", `%${payload.type}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Erreur Supabase lors du listing." }, { status: 500 });
    }

    return NextResponse.json({
      message: "Prospects récupérés.",
      data: data ?? [],
      pagination: {
        page: payload.page,
        pageSize: payload.pageSize,
        total: count ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur pendant la récupération des prospects." },
      { status: 500 },
    );
  }
}
