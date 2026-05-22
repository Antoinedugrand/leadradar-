import Link from "next/link";
import { notFound } from "next/navigation";

import { MainNav } from "@/components/main-nav";
import { ProspectDetailClient } from "@/components/prospect-detail-client";
import { getServerT } from "@/lib/i18n/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { t } = await getServerT();
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const prospect = data as Prospect;

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="mb-6 text-xs text-muted-foreground">
          <Link href="/prospects" className="font-medium text-primary hover:underline">
            {t("detail.allProspects")}
          </Link>
          <span className="mx-2 text-border">·</span>
          <Link href="/map-search" className="font-medium text-primary hover:underline">
            {t("nav.map")}
          </Link>
        </p>
        <ProspectDetailClient prospect={prospect} />
      </main>
    </>
  );
}
