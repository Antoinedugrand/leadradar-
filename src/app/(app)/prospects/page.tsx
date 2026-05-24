import Link from "next/link";

import { AppTopbar } from "@/components/app/app-topbar";
import { ProspectsTopbarActions } from "@/components/app/prospects-topbar-actions";
import { ProspectsListClient } from "@/components/prospects-list-client";
import { getServerT } from "@/lib/i18n/server";
import { sortProspectsByScore } from "@/lib/prospect-scorer";
import { Prospect } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProspectsPage() {
  const { t } = await getServerT();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .in("status", ["new", "audited"])
    .limit(200);
  const prospects = sortProspectsByScore((data ?? []) as Prospect[]).slice(0, 100);

  return (
    <>
      <AppTopbar
        title={t("prospects.title")}
        crumbs={[t("nav.prospecting"), t("nav.prospects")]}
        actions={<ProspectsTopbarActions prospects={prospects} />}
      />
      <div className="lr-content">
        <ProspectsListClient
          prospects={prospects}
          errorMessage={error ? t("prospects.loadError", { message: error.message }) : null}
        />
      </div>
    </>
  );
}
