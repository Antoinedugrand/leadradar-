import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createSupabaseServerUserClient, getServerUser } from "@/lib/supabase/server-user";

export async function requireApiUser() {
  const supabase = await createSupabaseServerUserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    } as const;
  }

  return { supabase, user } as const;
}

export async function getUserBillingProfile(userId: string) {
  const supabase = await createSupabaseServerUserClient();
  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function requirePageUser() {
  const session = await getServerUser();
  if (!session) {
    redirect("/login");
  }
  return session;
}
