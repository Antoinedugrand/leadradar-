"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Gauge,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { AuditProspectButton } from "@/components/audit-prospect-button";
import { ContactStateDropdown } from "@/components/contact-state-dropdown";
import { FetchReviewsButton } from "@/components/fetch-reviews-button";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { ExternalWebsiteLink } from "@/components/app/external-website-link";
import { ContactSourceHint } from "@/components/app/contact-source-hint";
import { SocialLinksList } from "@/components/app/social-links-list";
import { ProspectAvatar } from "@/components/app/prospect-avatar";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { ScoreArc } from "@/components/app/score-arc";
import { StatusBadge } from "@/components/app/status-badge";
import { BusinessTypeDisplay } from "@/components/app/business-type-display";
import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getDisplayScore, getScoreLabelMeta } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

interface ProspectDetailClientProps {
  prospect: Prospect;
}

function DetailField({
  label,
  value,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div style={{ gridColumn: wide ? "span 2" : "auto" }}>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--slate-400)]">
        {label}
      </div>
      <div className="text-[13px] text-[var(--slate-800)]">{value}</div>
    </div>
  );
}

function ReviewInsight({ tone, text }: { tone: "emerald" | "amber" | "red"; text: string }) {
  const bg =
    tone === "emerald"
      ? "rgba(16,185,129,0.08)"
      : tone === "amber"
        ? "rgba(245,158,11,0.10)"
        : "rgba(239,68,68,0.08)";
  const fg = tone === "emerald" ? "#047857" : tone === "amber" ? "#B45309" : "#B91C1C";

  return (
    <div
      className="flex items-start gap-2.5 rounded-[9px] px-3 py-2.5"
      style={{ background: bg }}
    >
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: fg }}
      />
      <span className="text-[13px] leading-snug" style={{ color: fg }}>
        {text}
      </span>
    </div>
  );
}

export function ProspectDetailClient({ prospect }: ProspectDetailClientProps) {
  const { t, locale } = useLocale();
  const [subject, setSubject] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"subject" | "body" | "full" | null>(null);

  const auditSignature = useMemo(
    () =>
      [
        prospect.audit_score,
        prospect.audit_summary,
        prospect.audit_issues?.join("|"),
        prospect.website_exists,
      ].join("::"),
    [
      prospect.audit_score,
      prospect.audit_summary,
      prospect.audit_issues,
      prospect.website_exists,
    ],
  );

  const hasAudit = prospect.audit_score !== null;

  const loadEmail = useCallback(
    async (regenerate = false) => {
      if (regenerate) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = regenerate
          ? await fetch(`/api/prospects/${prospect.id}/pitch-email?language=${locale}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ regenerate: true, useAuditContext: true }),
            })
          : await fetch(`/api/prospects/${prospect.id}/pitch-email?language=${locale}`);

        const data = (await res.json()) as {
          subject?: string;
          body?: string;
          fallback?: boolean;
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? t("emailDialog.generateError"));
          setSubject(null);
          setBody(null);
          return;
        }

        setSubject(data.subject ?? null);
        setBody(data.body ?? null);
        if (data.fallback) {
          toast.info(t("emailDialog.fallback"));
        }
      } catch {
        setError(t("common.networkError"));
      } finally {
        if (regenerate) {
          setRegenerating(false);
        } else {
          setLoading(false);
        }
      }
    },
    [locale, prospect.id, t],
  );

  useEffect(() => {
    void loadEmail(false);
  }, [loadEmail, auditSignature]);

  async function copyText(label: "subject" | "body" | "full", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const fullMail = subject && body ? t("detail.subjectPrefix", { subject, body }) : null;
  const auditIssues = (prospect.audit_issues ?? []).filter(
    (line): line is string => typeof line === "string" && line.trim().length > 0,
  );
  const score = getDisplayScore(prospect);
  const screenshotUrl =
    prospect.screenshot_url ??
    (prospect.website_url
      ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(prospect.website_url)}?w=1024&h=768`
      : null);
  const verdict = !prospect.website_exists
    ? t("verdict.noWebsiteCreation")
    : (prospect.audit_summary ?? (auditIssues.length > 0 ? auditIssues[0] : null));
  const scoreLabel =
    score !== null
      ? t(getScoreLabelMeta(prospect.score_label ?? (score <= 30 ? "hot" : score <= 60 ? "warm" : "cold")).labelKey)
      : t("detail.notAudited");

  const reviewInsights = prospect.review_insights;

  return (
    <div className="space-y-5">
      <div className="lr-card lr-card-pad-lg flex flex-wrap items-center gap-6">
        <ProspectAvatar
          name={prospect.name}
          score={score}
          scoreLabel={prospect.score_label}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h2
              className="m-0 text-[28px] font-bold tracking-[-0.02em] text-[var(--slate-900)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {prospect.name}
            </h2>
            <ProspectScoreBadge prospect={prospect} size="md" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--slate-500)]">
            {prospect.address ? (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} />
                {prospect.address}
              </span>
            ) : null}
            <BusinessTypeDisplay prospect={prospect} />
            <GoogleRatingBadge
              rating={prospect.google_rating}
              reviewCount={prospect.google_review_count}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ContactStateDropdown
            prospectId={prospect.id}
            status={prospect.status}
            contactPipeline={prospect.contact_pipeline}
            hasAudit={Boolean(prospect.audit_score)}
          />
          {prospect.website_url ? (
            <ExternalWebsiteLink url={prospect.website_url} className="lr-btn lr-btn-secondary lr-btn-sm">
              <Globe size={12} />
              {t("detail.viewSite")} <ArrowUpRight size={12} />
            </ExternalWebsiteLink>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="lr-card lr-card-pad-lg">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="lr-stat-ico h-7 w-7">
                <Gauge size={15} />
              </span>
              <div className="lr-card-title">{t("detail.auditSection")}</div>
            </div>

            {prospect.website_url ? (
              <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
                <ExternalWebsiteLink
                  url={prospect.website_url}
                  className="lr-site-shot relative block overflow-hidden no-underline"
                  title={t("detail.viewSite")}
                >
                  <div className="lr-shot-chrome">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                    <span className="url" />
                  </div>
                  {screenshotUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={screenshotUrl}
                      alt={t("detail.screenshotAlt", { name: prospect.name })}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-[var(--slate-500)]">
                      {prospect.website_url}
                    </span>
                  )}
                </ExternalWebsiteLink>
                <div className="flex flex-col gap-4">
                  {score !== null ? (
                    <div className="flex items-center gap-4">
                      <ScoreArc score={score} />
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--slate-400)]">
                          {t("detail.overallScore")}
                        </div>
                        <div className="mt-1 text-[13px] font-semibold text-[var(--red)]">{scoreLabel}</div>
                      </div>
                    </div>
                  ) : null}
                  <p className="text-sm italic leading-relaxed text-[var(--slate-700)]">
                    {verdict ? `« ${verdict} »` : t("verdict.notAuditedYet")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <AuditProspectButton
                      prospectId={prospect.id}
                      websiteUrl={prospect.website_url}
                      leadRadar
                    />
                    <ExternalWebsiteLink url={prospect.website_url} className="lr-btn lr-btn-secondary lr-btn-sm">
                      <Globe size={12} />
                      {t("detail.viewSite")} <ExternalLink size={12} />
                    </ExternalWebsiteLink>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lr-alert danger">
                <div className="lr-alert-ico">
                  <Globe size={16} />
                </div>
                <div>
                  <h4>{t("detail.noWebsiteTitle")}</h4>
                  <p>{t("detail.noWebsiteQuote")}</p>
                  <div className="mt-3">
                    <GenerateSiteDialog prospect={prospect} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lr-card lr-card-pad-lg">
            <div className="mb-3.5 flex items-center gap-2.5">
              <div className="lr-card-title">{t("detail.issuesTitle")}</div>
              {auditIssues.length > 0 ? (
                <span className="rounded-full bg-[rgba(239,68,68,0.10)] px-2 py-0.5 text-[11px] font-semibold text-[var(--red)]">
                  {t("detail.issuesCount", { count: auditIssues.length })}
                </span>
              ) : null}
            </div>
            {auditIssues.length > 0 ? (
              <ol className="flex flex-col gap-2.5">
                {auditIssues.map((issue, index) => (
                  <li key={`${index}-${issue.slice(0, 32)}`} className="flex items-start gap-3">
                    <span className="lr-mono flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--slate-100)] text-[11px] text-[var(--slate-600)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pt-1 text-[13px] text-[var(--slate-800)]">{issue}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--slate-500)]">{t("detail.noIssues")}</p>
            )}
          </div>

          <div className="lr-card lr-card-pad-lg">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="lr-stat-ico h-7 w-7">
                <Mail size={15} />
              </span>
              <div className="lr-card-title">{t("detail.emailExample")}</div>
              <span className="ml-auto rounded-full bg-[rgba(67,56,202,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[var(--indigo)]">
                {t("detail.aiGenerated")}
              </span>
              <button
                type="button"
                className="lr-btn lr-btn-ghost lr-btn-sm"
                disabled={!hasAudit || loading || regenerating}
                title={!hasAudit ? t("detail.notAudited") : undefined}
                onClick={() => void loadEmail(true)}
              >
                {regenerating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Wand2 size={12} />
                )}
                {regenerating ? t("detail.regeneratingEmail") : t("detail.regenerateEmailAudit")}
              </button>
            </div>

            {loading ? (
              <p className="inline-flex items-center gap-2 text-sm text-[var(--slate-500)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("detail.generatingEmail")}
              </p>
            ) : error ? (
              <p className="text-sm text-[var(--red)]">{error}</p>
            ) : subject && body ? (
              <>
                <label className="lr-label">{t("detail.subject")}</label>
                <div className="mb-3.5 flex items-center gap-2">
                  <div className="lr-input flex-1 bg-[var(--slate-50)]">{subject}</div>
                  <button
                    type="button"
                    className="lr-btn lr-btn-secondary lr-btn-sm"
                    onClick={() => copyText("subject", subject)}
                  >
                    <Check size={12} />
                    {copied === "subject" ? t("common.copied") : t("detail.copySubject")}
                  </button>
                </div>

                <label className="lr-label">{t("detail.message")}</label>
                <div className="lr-input lr-textarea-mono min-h-[200px] whitespace-pre-wrap bg-[var(--slate-50)]">
                  {body}
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="lr-btn lr-btn-secondary"
                    onClick={() => copyText("body", body)}
                  >
                    <Copy size={13} />
                    {copied === "body" ? t("common.copied") : t("detail.copyBody")}
                  </button>
                  {fullMail ? (
                    <button
                      type="button"
                      className="lr-btn lr-btn-dark"
                      onClick={() => copyText("full", fullMail)}
                    >
                      <Copy size={13} />
                      {copied === "full" ? t("common.copied") : t("detail.copyAll")}
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--slate-500)]">{t("detail.noContent")}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="lr-card lr-card-pad-lg">
            <div className="lr-card-title mb-3.5">{t("detail.business")}</div>
            <div className="grid grid-cols-2 gap-3.5">
              <DetailField label={t("common.type")} value={<BusinessTypeDisplay prospect={prospect} />} />
              <DetailField
                label={t("detail.auditScore")}
                value={
                  <span className="lr-mono">
                    {score !== null ? `${score}/100` : "—"}
                  </span>
                }
              />
              <DetailField label={t("common.city")} value={prospect.city ?? "—"} />
              <DetailField
                label={t("common.status")}
                value={
                  <StatusBadge
                    kind={
                      prospect.status === "replied"
                        ? "replied"
                        : prospect.status === "emailed" || prospect.status === "converted"
                          ? "contacted"
                          : "new"
                    }
                    label={prospect.status}
                  />
                }
              />
              <DetailField
                label={t("common.phone")}
                value={
                  <span className="lr-mono">
                    {prospect.phone ?? "—"}
                    {prospect.phone ? <ContactSourceHint source={prospect.phone_source} /> : null}
                  </span>
                }
                wide
              />
              <DetailField
                label={t("common.email")}
                value={
                  <span className="lr-mono">
                    {prospect.email ?? "—"}
                    {prospect.email ? <ContactSourceHint source={prospect.email_source} /> : null}
                  </span>
                }
                wide
              />
              <DetailField label={t("common.address")} value={prospect.address ?? "—"} wide />
              <DetailField
                label={t("common.website")}
                value={
                  prospect.website_url ? (
                    <ExternalWebsiteLink url={prospect.website_url} className="text-[var(--indigo)]">
                      {prospect.website_url}
                    </ExternalWebsiteLink>
                  ) : (
                    "—"
                  )
                }
                wide
              />
              <DetailField
                label={t("detail.socialLinks")}
                value={<SocialLinksList links={prospect.social_links} />}
                wide
              />
            </div>
          </div>

          <div className="lr-card lr-card-pad-lg">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="lr-stat-ico h-7 w-7">
                <Gauge size={15} />
              </span>
              <div className="lr-card-title">{t("detail.reviewsTitle")}</div>
            </div>
            {prospect.google_rating !== null ? (
              <div className="mb-3.5 flex items-center gap-3.5">
                <div
                  className="text-[38px] font-bold tracking-[-0.025em] text-[var(--slate-900)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {prospect.google_rating.toFixed(1)}
                </div>
                <div>
                  <GoogleRatingBadge
                    rating={prospect.google_rating}
                    reviewCount={prospect.google_review_count}
                  />
                  {prospect.google_review_count ? (
                    <div className="mt-1 text-xs text-[var(--slate-500)]">
                      {t("detail.reviewCount", { count: prospect.google_review_count })}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mb-3.5 flex flex-col gap-2.5">
              {reviewInsights?.summary ? (
                <ReviewInsight tone="emerald" text={reviewInsights.summary} />
              ) : null}
              {reviewInsights?.website_improvements?.slice(0, 1).map((text) => (
                <ReviewInsight key={text} tone="red" text={text} />
              ))}
              {reviewInsights?.service_improvements?.slice(0, 1).map((text) => (
                <ReviewInsight key={text} tone="amber" text={text} />
              ))}
              {reviewInsights?.improvement_points?.slice(0, 1).map((text) => (
                <ReviewInsight key={text} tone="amber" text={text} />
              ))}
            </div>

            <FetchReviewsButton
              prospectId={prospect.id}
              googlePlaceId={prospect.google_place_id}
            />
          </div>

          <div className="lr-card lr-card-pad-lg">
            <div className="lr-card-title mb-3.5">{t("detail.quickActions")}</div>
            <div className="flex flex-col gap-2">
              <AuditProspectButton
                prospectId={prospect.id}
                websiteUrl={prospect.website_url}
                leadRadar
                className="w-full justify-start"
              />
              <GenerateSiteDialog
                prospect={prospect}
                trigger={
                  <button type="button" className="lr-btn lr-btn-secondary w-full justify-start">
                    <Wand2 size={14} />
                    {t("siteGen.generate")}
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
