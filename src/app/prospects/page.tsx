import Link from "next/link";
import { ExternalLink, Globe, GlobeLock } from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { AuditAllButton } from "@/components/audit-all-button";
import { AuditProspectButton } from "@/components/audit-prospect-button";
import { ContactToggleButton } from "@/components/contact-toggle-button";
import { EmailCell } from "@/components/email-cell";
import { EmailDialog } from "@/components/email-dialog";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { Badge } from "@/components/ui/badge";
import { getServerT } from "@/lib/i18n/server";
import { sortProspectsByScore } from "@/lib/prospect-scorer";
import { Prospect } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProspectsPage() {
  const { t } = await getServerT();
  const headers = [
    t("common.name"),
    t("common.address"),
    t("common.email"),
    t("table.siteAudit"),
    t("table.verdict"),
    t("common.status"),
    t("common.actions"),
  ];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .in("status", ["new", "audited"])
    .limit(200);
  const prospects = sortProspectsByScore((data ?? []) as Prospect[]).slice(0, 100);

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("prospects.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("prospects.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t("prospects.count", { count: prospects.length })}</Badge>
            <AuditAllButton prospects={prospects} variant="default" />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td className="px-4 py-3 text-destructive" colSpan={headers.length}>
                      {t("prospects.loadError", { message: error.message })}
                    </td>
                  </tr>
                ) : prospects.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-12 text-center text-muted-foreground"
                      colSpan={headers.length}
                    >
                      {t("prospects.empty")}{" "}
                      <Link href="/map-search" className="font-medium text-primary hover:underline">
                        {t("common.map")}
                      </Link>
                      .
                    </td>
                  </tr>
                ) : (
                  prospects.map((prospect) => {
                    const verdict = !prospect.website_exists
                      ? t("verdict.noWebsite")
                      : (prospect.audit_summary ??
                        (prospect.audit_issues && prospect.audit_issues.length > 0
                          ? prospect.audit_issues[0]
                          : null));
                    return (
                      <tr key={prospect.id} className="border-t border-border hover:bg-accent/30 align-top">
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">{prospect.name}</span>
                            <ProspectScoreBadge prospect={prospect} />
                          </div>
                          {prospect.type ? (
                            <div className="mt-1 text-xs text-muted-foreground">{prospect.type}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {prospect.address ?? "—"}
                          {prospect.phone ? (
                            <div className="mt-1 text-xs">{prospect.phone}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <EmailCell email={prospect.email} />
                        </td>
                        <td className="px-4 py-3">
                          {prospect.website_url ? (
                            <a
                              href={`/visit?url=${encodeURIComponent(prospect.website_url)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                              <Globe className="h-3 w-3" /> {t("common.open")}{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-destructive">
                              <GlobeLock className="h-3 w-3" /> {t("common.none")}
                            </span>
                          )}
                          {!prospect.website_exists || !prospect.website_url ? (
                            <div className="mt-1.5">
                              <GenerateSiteDialog prospect={prospect} />
                            </div>
                          ) : null}
                          {prospect.audit_score === null &&
                          prospect.prospect_score === null &&
                          prospect.website_url ? (
                            <div className="mt-1.5">
                              <AuditProspectButton
                                prospectId={prospect.id}
                                websiteUrl={prospect.website_url}
                              />
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 max-w-[280px]">
                          {verdict ? (
                            <p className="line-clamp-3 text-xs italic text-foreground/80">
                              « {verdict} »
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t("prospects.notAuditedYet")}</span>
                          )}
                          {prospect.audit_issues && prospect.audit_issues.length > 1 ? (
                            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] leading-snug text-muted-foreground">
                              {prospect.audit_issues.slice(1, 3).map((issue) => (
                                <li key={issue}>{issue}</li>
                              ))}
                            </ul>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <ContactToggleButton
                            prospectId={prospect.id}
                            status={prospect.status}
                            hasAudit={Boolean(prospect.audit_score)}
                          />
                          <Badge variant="outline" className="mt-1.5">
                            {prospect.status === "new" ? t("common.new") : t("common.audited")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            <EmailDialog prospect={prospect} />
                            <Link
                              href={`/prospects/${prospect.id}/detail`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              {t("common.details")} <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
