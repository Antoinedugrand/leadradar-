import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/app/app-topbar";
import { ProspectDetailTopbarActions } from "@/components/app/prospect-detail-topbar-actions";
import { ProspectDetailClient } from "@/components/prospect-detail-client";
import { requirePageUser } from "@/lib/auth/require-user";
import { getServerT } from "@/lib/i18n/server";
import type { Prospect } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { t } = await getServerT();
  const { id } = await params;
  const { supabase } = await requirePageUser();
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
      <AppTopbar
        title={prospect.name}
        crumbs={[t("nav.prospecting"), t("nav.prospects"), prospect.name]}
        actions={<ProspectDetailTopbarActions prospect={prospect} />}
      />
      <div className="lr-content">
        <ProspectDetailClient prospect={prospect} />
      </div>
    </>
  );
}
