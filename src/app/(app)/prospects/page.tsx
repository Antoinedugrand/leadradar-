import { AppTopbar } from "@/components/app/app-topbar";
import { ProspectsTopbarActions } from "@/components/app/prospects-topbar-actions";
import { ProspectsListClient } from "@/components/prospects-list-client";
import { requirePageUser } from "@/lib/auth/require-user";
import { getServerT } from "@/lib/i18n/server";
import { sortProspectsByScore } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

export default async function ProspectsPage() {
  const { t } = await getServerT();
  const { supabase } = await requirePageUser();
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
