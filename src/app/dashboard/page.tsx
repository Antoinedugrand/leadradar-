import Link from "next/link";
import {
  ArrowRight,
  GlobeLock,
  MapPin,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { getServerT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

const lowScoreThreshold = 45;

export default async function DashboardPage() {
  const { t } = await getServerT();
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const prospects = (data ?? []) as Prospect[];

  const stats = {
    total: prospects.length,
    noSite: prospects.filter((p) => !p.website_exists).length,
    badSite: prospects.filter(
      (p) => p.website_exists && p.audit_score !== null && p.audit_score <= lowScoreThreshold,
    ).length,
    contacted: prospects.filter(
      (p) => p.status === "emailed" || p.status === "replied" || p.status === "converted",
    ).length,
  };

  const recent = prospects.slice(0, 6);

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> {t("dashboard.badge")}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
              <p className="max-w-xl text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg" className="gap-2">
                <Link href="/map-search">
                  <MapPin className="h-4 w-4" /> {t("dashboard.startSearch")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/prospects">
                  {t("dashboard.viewProspects")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("dashboard.statTotal")}
            value={stats.total}
            icon={<Target className="h-4 w-4" />}
            tone="default"
          />
          <StatCard
            label={t("dashboard.statNoSite")}
            value={stats.noSite}
            icon={<GlobeLock className="h-4 w-4" />}
            tone="destructive"
          />
          <StatCard
            label={t("dashboard.statBadSite")}
            value={stats.badSite}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="primary"
          />
          <StatCard
            label={t("dashboard.statContacted")}
            value={stats.contacted}
            icon={<Mail className="h-4 w-4" />}
            tone="default"
          />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h2 className="font-semibold">{t("dashboard.recentTitle")}</h2>
                <p className="text-xs text-muted-foreground">{t("dashboard.recentSubtitle")}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/prospects">
                  {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {recent.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                {t("dashboard.empty")}{" "}
                <Link href="/map-search" className="font-medium text-primary hover:underline">
                  {t("common.map")}
                </Link>
                .
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((p) => {
                  return (
                    <li key={p.id} className="flex items-start gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{p.name}</h3>
                          <ProspectScoreBadge prospect={p} />
                          {p.type ? (
                            <Badge variant="outline" className="text-[10px]">
                              {p.type}
                            </Badge>
                          ) : null}
                        </div>
                        {p.address ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {p.address}
                          </p>
                        ) : null}
                        {(() => {
                          const verdict = !p.website_exists ? t("verdict.noWebsite")
                            : (p.audit_summary ??
                              (p.audit_issues && p.audit_issues.length > 0
                                ? p.audit_issues[0]
                                : null));
                          return verdict ? (
                            <p className="mt-1 line-clamp-2 text-xs italic text-foreground/80">
                              « {verdict} »
                            </p>
                          ) : null;
                        })()}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          {p.website_exists ? (
                            <span className="text-muted-foreground">{t("common.withSite")}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-destructive">
                              <GlobeLock className="h-3 w-3" /> {t("common.noSite")}
                            </span>
                          )}
                          <span className="uppercase tracking-wide text-muted-foreground">
                            {p.status}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="text-xs">
                        <Link href={`/prospects/${p.id}/detail`}>{t("common.details")}</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="space-y-4">
            <ActionCard
              title={t("dashboard.cardMapTitle")}
              description={t("dashboard.cardMapDesc")}
              href="/map-search"
              cta={t("dashboard.cardMapCta")}
              icon={<MapPin className="h-5 w-5" />}
              gradient
            />
            <ActionCard
              title={t("dashboard.cardAuditTitle")}
              description={t("dashboard.cardAuditDesc")}
              href="/prospects"
              cta={t("dashboard.cardAuditCta")}
              icon={<Sparkles className="h-5 w-5" />}
            />
            <ActionCard
              title={t("dashboard.cardEmailTitle")}
              description={t("dashboard.cardEmailDesc")}
              href="/email-editor"
              cta={t("dashboard.cardEmailCta")}
              icon={<Mail className="h-5 w-5" />}
            />
          </aside>
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "default" | "destructive" | "primary";
}) {
  const valueClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "primary"
        ? "text-primary"
        : "text-foreground";
  const iconClass =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "primary"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconClass)}>
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold leading-none", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  cta,
  icon,
  gradient,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
  gradient?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        gradient && "text-primary-foreground hover:shadow-lg",
      )}
      style={gradient ? { background: "var(--gradient-hero)", borderColor: "transparent" } : undefined}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            gradient ? "bg-white/15 text-white" : "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              gradient ? "text-white/85" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5",
              gradient ? "text-white" : "text-primary",
            )}
          >
            {cta} <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
