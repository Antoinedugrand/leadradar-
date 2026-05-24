import Link from "next/link";
import { Clock, Download, Inbox, Send, Target } from "lucide-react";

import { AppTopbar } from "@/components/app/app-topbar";
import { ProspectAvatar } from "@/components/app/prospect-avatar";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { ContactPipelineControls } from "@/components/contact-pipeline-controls";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { getDisplayScore } from "@/lib/prospect-scorer";
import { Prospect } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Vue = "all" | "waiting" | "done";

function pipelineStatus(prospect: Prospect): "pending" | "replied" | "won" {
  if (prospect.contact_pipeline === "project_done" || prospect.status === "converted") {
    return "won";
  }
  if (prospect.status === "replied") return "replied";
  return "pending";
}

export default async function ContactedPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { t } = await getServerT();
  const locale = await getServerLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const { vue: vueRaw } = await searchParams;
  const vue: Vue = vueRaw === "waiting" || vueRaw === "done" ? vueRaw : "all";

  const supabase = getSupabaseServerClient();
  const { data: allData } = await supabase
    .from("prospects")
    .select("*")
    .in("status", ["emailed", "replied", "converted"])
    .limit(500);
  const allContacted = (allData ?? []) as Prospect[];

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

  const stats = {
    total: allContacted.length,
    awaiting: allContacted.filter((p) => pipelineStatus(p) === "pending").length,
    replies: allContacted.filter((p) => p.status === "replied").length,
    won: allContacted.filter((p) => pipelineStatus(p) === "won").length,
  };

  const tabs = [
    { id: "all" as const, label: t("contacted.tabAll"), count: stats.total, href: "/contacted" },
    {
      id: "waiting" as const,
      label: t("contacted.tabPending"),
      count: stats.awaiting,
      href: "/contacted?vue=waiting",
    },
    {
      id: "done" as const,
      label: t("contacted.tabDone"),
      count: stats.won,
      href: "/contacted?vue=done",
    },
  ];

  return (
    <>
      <AppTopbar
        title={t("contacted.title")}
        crumbs={[t("nav.prospecting"), t("nav.contacted")]}
        actions={
          <>
            <button type="button" className="lr-btn lr-btn-secondary" disabled>
              <Download size={14} />
              {t("export.button", { count: prospects.length })}
            </button>
          </>
        }
      />
      <div className="lr-content">
        <div className="lr-grid lr-grid-4 mb-5">
          <StatCard icon={Send} label={t("contacted.statContacted")} value={stats.total} />
          <StatCard
            icon={Clock}
            tone="warn"
            label={t("contacted.statAwaiting")}
            value={stats.awaiting}
          />
          <StatCard
            icon={Inbox}
            tone="success"
            label={t("contacted.statReplies")}
            value={stats.replies}
          />
          <StatCard
            icon={Target}
            tone="success"
            label={t("contacted.statWon")}
            value={stats.won}
          />
        </div>

        <div className="lr-tabs mb-4">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn("lr-tab", vue === tab.id && "active")}
            >
              {tab.label}
              <span className="lr-tab-count">{tab.count}</span>
            </Link>
          ))}
        </div>

        <div className="lr-card overflow-hidden">
          <div className="lr-card-head">
            <div className="lr-card-title">
              {t("contacted.pipelineTitle", { count: prospects.length })}
            </div>
            <span className="ml-auto text-xs text-[var(--slate-500)]">
              {t("contacted.sortedByDate")}
            </span>
          </div>

          <div className="lr-table-wrap">
            <table className="lr-table">
              <thead>
                <tr>
                  <th style={{ width: 240 }}>{t("table.business")}</th>
                  <th style={{ width: 180 }}>{t("common.email")}</th>
                  <th style={{ width: 140 }}>{t("common.phone")}</th>
                  <th style={{ width: 130 }}>{t("contacted.dateContact")}</th>
                  <th style={{ width: 160 }}>{t("common.status")}</th>
                  <th>{t("contacted.followUp")}</th>
                  <th style={{ width: 80, textAlign: "right" }}>{t("common.details")}</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={7} className="text-[var(--red)]">
                      {t("contacted.loadError", { message: error.message })}
                    </td>
                  </tr>
                ) : prospects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--slate-500)]">
                      {t("contacted.empty")}
                    </td>
                  </tr>
                ) : (
                  prospects.map((prospect) => {
                    const status = pipelineStatus(prospect);
                    const score = getDisplayScore(prospect);
                    return (
                      <tr key={prospect.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <ProspectAvatar
                              name={prospect.name}
                              score={score}
                              scoreLabel={prospect.score_label}
                              size="sm"
                            />
                            <div className="text-[13.5px] font-semibold text-[var(--slate-900)]">
                              {prospect.name}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="lr-mono text-xs text-[var(--slate-700)]">
                            {prospect.email ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className="lr-mono text-xs text-[var(--slate-700)]">
                            {prospect.phone ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className="text-[13px] text-[var(--slate-700)]">
                            {prospect.emailed_at
                              ? new Date(prospect.emailed_at).toLocaleDateString(dateLocale)
                              : "—"}
                          </span>
                        </td>
                        <td>
                          {status === "pending" ? (
                            <StatusBadge kind="pending" label={t("contacted.pending")} />
                          ) : status === "replied" ? (
                            <StatusBadge kind="replied" label={t("contact.replied")} />
                          ) : (
                            <StatusBadge kind="won" label={t("contacted.tabDone")} />
                          )}
                        </td>
                        <td>
                          <ContactPipelineControls
                            prospectId={prospect.id}
                            pipeline={prospect.contact_pipeline}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href={`/prospects/${prospect.id}/detail`}
                            className="lr-btn lr-btn-link"
                          >
                            ↗
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
