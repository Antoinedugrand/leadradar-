import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ContactPipelineControls } from "@/components/contact-pipeline-controls";
import { MainNav } from "@/components/main-nav";
import { Badge } from "@/components/ui/badge";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { Prospect } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Vue = "all" | "waiting" | "done";

export default async function ContactedPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { t } = await getServerT();
  const locale = await getServerLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const tabs: { key: Vue; label: string; href: string }[] = [
    { key: "all", label: t("contacted.tabAll"), href: "/contacted" },
    { key: "waiting", label: t("contacted.tabPending"), href: "/contacted?vue=waiting" },
    { key: "done", label: t("contacted.tabDone"), href: "/contacted?vue=done" },
  ];

  const { vue: vueRaw } = await searchParams;
  const vue: Vue = vueRaw === "waiting" || vueRaw === "done" ? vueRaw : "all";

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("prospects")
    .select("*")
    .in("status", ["emailed", "replied", "converted"])
    .order("emailed_at", { ascending: false })
    .limit(100);

  if (vue === "waiting") {
    query = query.or("contact_pipeline.is.null,contact_pipeline.eq.waiting_reply");
  } else if (vue === "done") {
    query = query.eq("contact_pipeline", "project_done");
  }

  const { data, error } = await query;
  const prospects = (data ?? []) as Prospect[];

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("contacted.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("contacted.subtitle")}</p>
          </div>
          <Badge variant="secondary">{t("contacted.count", { count: prospects.length })}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                vue === tab.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("common.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.email")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.phone")}</th>
                  <th className="px-4 py-3 font-medium">{t("contacted.dateContact")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("contacted.followUp")}</th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td className="px-4 py-3 text-destructive" colSpan={7}>
                      {t("contacted.loadError", { message: error.message })}
                    </td>
                  </tr>
                ) : prospects.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-muted-foreground" colSpan={7}>
                      {t("contacted.empty")}
                    </td>
                  </tr>
                ) : (
                  prospects.map((prospect) => (
                    <tr key={prospect.id} className="border-t border-border hover:bg-accent/30 align-top">
                      <td className="px-4 py-3 font-semibold text-foreground">{prospect.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prospect.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prospect.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {prospect.emailed_at
                          ? new Date(prospect.emailed_at).toLocaleString(dateLocale)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="uppercase">
                          {prospect.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ContactPipelineControls
                          prospectId={prospect.id}
                          pipeline={prospect.contact_pipeline}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/prospects/${prospect.id}/detail`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {t("common.details")} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
