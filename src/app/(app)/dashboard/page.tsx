import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Globe,
  Mail,
  Map,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { DashboardRecentItem } from "@/components/app/dashboard-recent-item";
import { DashboardTopbarActions } from "@/components/app/dashboard-topbar-actions";
import { UpgradeSuccessBanner } from "@/components/billing/upgrade-success-banner";
import { StatCard } from "@/components/app/stat-card";
import { AppTopbar } from "@/components/app/app-topbar";
import { requirePageUser } from "@/lib/auth/require-user";
import { getServerT } from "@/lib/i18n/server";
import type { Prospect } from "@/lib/types";

const lowScoreThreshold = 45;

function countSince(prospects: Prospect[], days: number, predicate?: (prospect: Prospect) => boolean): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return prospects.filter((prospect) => {
    if (new Date(prospect.created_at).getTime() < cutoff) return false;
    return predicate ? predicate(prospect) : true;
  }).length;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const { t } = await getServerT();
  const { upgrade } = await searchParams;
  const { supabase } = await requirePageUser();
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
    replies: prospects.filter((p) => p.status === "replied" || p.status === "converted").length,
  };

  const weekCounts = {
    total: countSince(prospects, 7),
    noSite: countSince(prospects, 7, (p) => !p.website_exists),
    badSite: countSince(
      prospects,
      7,
      (p) =>
        p.website_exists && p.audit_score !== null && p.audit_score <= lowScoreThreshold,
    ),
  };

  const recent = prospects.slice(0, 6);

  const recentLabels = {
    noWebsite: t("dashboard.statNoSite"),
    siteFailing: t("dashboard.siteFailing"),
    siteOk: t("dashboard.siteOk"),
    statusNew: t("common.new"),
    statusAudited: t("common.audited"),
    statusContacted: t("contact.contacted"),
    statusReplied: t("contact.replied"),
    statusConverted: t("contacted.tabDone"),
    details: t("common.details"),
  };

  return (
    <>
      <AppTopbar
        title={t("dashboard.title")}
        crumbs={[t("nav.workspace"), t("nav.dashboard")]}
        actions={<DashboardTopbarActions prospects={prospects} />}
      />
      <div className="lr-content lr-content-narrow">
        {upgrade === "success" ? <UpgradeSuccessBanner /> : null}
        {/* Hero */}
        <div className="lr-hero mb-6">
          <div className="lr-radar-rings">
            <div className="ring r1" />
            <div className="ring r2" />
            <div className="ring r3" />
            <div className="ring r4" />
          </div>
          <div className="relative max-w-[600px]">
            <span className="lr-pill lr-hero-pill">
              <span className="dot" />
              {t("dashboard.badge")}
              <Sparkles size={12} />
            </span>
            <h1
              className="mb-2.5 mt-3.5 text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("dashboard.title")}
            </h1>
            <p className="max-w-[480px] text-[15px] leading-relaxed text-white/78">
              {t("dashboard.subtitle")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/map-search" className="lr-btn lr-btn-lg lr-hero-btn-primary">
                {t("dashboard.startSearch")} <ArrowRight size={15} />
              </Link>
              <Link href="/prospects" className="lr-btn lr-btn-lg lr-hero-btn-secondary">
                {t("dashboard.viewProspects")}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lr-grid lr-grid-4 mb-6">
          <StatCard
            icon={Target}
            label={t("dashboard.statTotal")}
            value={stats.total}
            delta={
              weekCounts.total > 0
                ? t("dashboard.weekDelta", { count: weekCounts.total })
                : undefined
            }
          />
          <StatCard
            icon={Globe}
            tone="danger"
            label={t("dashboard.statNoSite")}
            value={stats.noSite}
            delta={
              weekCounts.noSite > 0
                ? t("dashboard.weekDelta", { count: weekCounts.noSite })
                : undefined
            }
          />
          <StatCard
            icon={TrendingUp}
            tone="warn"
            label={t("dashboard.statBadSite")}
            value={stats.badSite}
            delta={
              weekCounts.badSite > 0
                ? t("dashboard.weekDelta", { count: weekCounts.badSite })
                : undefined
            }
          />
          <StatCard
            icon={Mail}
            tone="success"
            label={t("dashboard.statContacted")}
            value={stats.contacted}
            delta={
              stats.replies > 0
                ? t("dashboard.repliesDelta", { count: stats.replies })
                : undefined
            }
          />
        </div>

        {/* Recent + action cards */}
        <div className="lr-dash-split">
          <div className="lr-card overflow-hidden">
            <div className="lr-card-head">
              <div>
                <div className="lr-card-title">{t("dashboard.recentTitle")}</div>
                <div className="lr-card-sub">{t("dashboard.recentSubtitle")}</div>
              </div>
              <Link
                href="/prospects"
                className="lr-btn lr-btn-link"
                style={{ marginLeft: "auto" }}
              >
                {t("dashboard.viewAll")} →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-[22px] py-12 text-center text-sm text-[var(--slate-500)]">
                {t("dashboard.empty")}{" "}
                <Link href="/map-search" className="font-semibold text-[var(--indigo)]">
                  {t("common.map")}
                </Link>
                .
              </div>
            ) : (
              <div>
                {recent.map((prospect, index) => (
                  <DashboardRecentItem
                    key={prospect.id}
                    prospect={prospect}
                    last={index === recent.length - 1}
                    labels={recentLabels}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            {/* Map card */}
            <div className="lr-hero px-6 py-5">
              <span className="lr-pill lr-hero-pill">
                <Map size={12} /> {t("dashboard.cardMapTitle")}
              </span>
              <h3
                className="mb-1.5 mt-2.5 text-[22px] font-bold tracking-[-0.02em] text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t("dashboard.cardMapHeadline")}
              </h3>
              <p className="mb-3.5 text-[13px] leading-relaxed text-white/74">
                {t("dashboard.cardMapDesc")}
              </p>
              <Link href="/map-search" className="lr-btn lr-hero-btn-primary w-full justify-center">
                {t("dashboard.cardMapCta")} <ArrowRight size={14} />
              </Link>
            </div>

            {/* Audit card */}
            <div className="lr-card lr-card-pad">
              <div className="flex items-start gap-3">
                <span className="lr-stat-ico">
                  <Gauge size={18} />
                </span>
                <div className="flex-1">
                  <div
                    className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--slate-900)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t("dashboard.cardAuditTitle")}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--slate-500)]">
                    {t("dashboard.cardAuditDesc")}
                  </p>
                </div>
              </div>
              <Link
                href="/prospects"
                className="lr-btn lr-btn-secondary mt-3.5 w-full justify-center"
              >
                {t("dashboard.cardAuditCta")} <ArrowRight size={13} />
              </Link>
            </div>

            {/* Email card */}
            <div className="lr-card lr-card-pad">
              <div className="flex items-start gap-3">
                <span className="lr-stat-ico">
                  <Send size={18} />
                </span>
                <div className="flex-1">
                  <div
                    className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--slate-900)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t("dashboard.cardEmailTitle")}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--slate-500)]">
                    {t("dashboard.cardEmailDesc")}
                  </p>
                </div>
              </div>
              <Link
                href="/email-editor"
                className="lr-btn lr-btn-secondary mt-3.5 w-full justify-center"
              >
                {t("dashboard.cardEmailCta")} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
