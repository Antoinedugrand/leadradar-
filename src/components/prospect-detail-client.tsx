"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";

import { AuditProspectButton } from "@/components/audit-prospect-button";
import { FetchReviewsButton } from "@/components/fetch-reviews-button";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { ProspectReviewInsights } from "@/components/prospect-review-insights";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { Prospect } from "@/lib/types";

interface ProspectDetailClientProps {
  prospect: Prospect;
}

export function ProspectDetailClient({ prospect }: ProspectDetailClientProps) {
  const { t, locale } = useLocale();
  const [subject, setSubject] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"subject" | "body" | "full" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/prospects/${prospect.id}/pitch-email?language=${locale}`);
        const data = (await res.json()) as {
          subject?: string;
          body?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? t("emailDialog.generateError"));
          setSubject(null);
          setBody(null);
          return;
        }
        setSubject(data.subject ?? null);
        setBody(data.body ?? null);
      } catch {
        if (!cancelled) setError(t("common.networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [prospect.id, locale, t]);

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

  const screenshotUrl =
    prospect.screenshot_url ??
    (prospect.website_url
      ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(prospect.website_url)}?w=1024&h=768`
      : null);

  const scoreColor = !prospect.website_exists
    ? "text-destructive"
    : prospect.audit_score === null
      ? "text-muted-foreground"
      : prospect.audit_score < 40
        ? "text-destructive"
        : prospect.audit_score <= 65
          ? "text-amber-600"
          : "text-emerald-600";

  const verdict = !prospect.website_exists
    ? t("verdict.noWebsiteCreation")
    : (prospect.audit_summary ?? (auditIssues.length > 0 ? auditIssues[0] : null));

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link href="/map-search">
            <ArrowLeft className="h-3 w-3" /> {t("detail.backToMap")}
          </Link>
        </Button>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{prospect.name}</h1>
          <ProspectScoreBadge prospect={prospect} size="md" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("detail.subtitle")}
        </p>
      </div>

      {prospect.website_url ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid gap-0 sm:grid-cols-[280px_1fr]">
            <div className="relative aspect-[4/3] bg-muted sm:aspect-auto">
              {screenshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotUrl}
                  alt={t("detail.screenshotAlt", { name: prospect.name })}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between gap-4 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("detail.verdict")}
                  </p>
                  {prospect.audit_score !== null ? (
                    <span className={cn("text-sm font-bold", scoreColor)}>
                      {prospect.audit_score}/100
                    </span>
                  ) : (
                    <Badge variant="outline">{t("detail.notAudited")}</Badge>
                  )}
                </div>
                <p className="mt-2 text-base italic leading-relaxed text-foreground">
                  {verdict ? `« ${verdict} »` : t("verdict.notAuditedYet")}
                </p>
                {auditIssues.length > 1 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {auditIssues.slice(1).map((issue, idx) => (
                      <li key={`${idx}-${issue.slice(0, 32)}`}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {prospect.audit_score === null ? (
                  <AuditProspectButton
                    prospectId={prospect.id}
                    websiteUrl={prospect.website_url}
                  />
                ) : (
                  <AuditProspectButton
                    prospectId={prospect.id}
                    websiteUrl={prospect.website_url}
                  />
                )}
                <Button asChild variant="outline" className="gap-1.5">
                  <a
                    href={`/visit?url=${encodeURIComponent(prospect.website_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("detail.viewSite")} <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-destructive">
            {t("detail.verdict")}
          </p>
          <p className="mt-2 text-base italic leading-relaxed text-foreground">
            {t("detail.noWebsiteQuote")}
          </p>
          <div className="mt-4">
            <GenerateSiteDialog prospect={prospect} />
          </div>
        </section>
      )}

      <section
        className={cn(
          "rounded-xl border p-5 shadow-sm",
          auditIssues.length > 0
            ? "border-amber-500/30 bg-amber-50/60"
            : "border-border bg-card",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{t("detail.issuesTitle")}</h2>
          {auditIssues.length > 0 ? (
            <Badge className="bg-amber-200 text-amber-950 hover:bg-amber-200">
              {t("detail.issuesCount", { count: auditIssues.length })}
            </Badge>
          ) : null}
        </div>
        {auditIssues.length > 0 ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            {auditIssues.map((issue, index) => (
              <li key={`${index}-${issue.slice(0, 48)}`} className="pl-1 marker:font-semibold">
                {issue}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("detail.noIssues")}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-orange-500/25 bg-orange-50/40 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t("detail.reviewsTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("detail.reviewsSubtitle")}
            </p>
          </div>
          <FetchReviewsButton
            prospectId={prospect.id}
            googlePlaceId={prospect.google_place_id}
          />
        </div>
        <div className="mt-4">
          {prospect.review_insights ? (
            <ProspectReviewInsights insights={prospect.review_insights} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("detail.reviewsHint")}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">{t("detail.business")}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <DetailRow label={t("common.type")} value={prospect.type} />
          <DetailRow label={t("common.address")} value={prospect.address} />
          <DetailRow label={t("common.city")} value={prospect.city} />
          <DetailRow label={t("common.phone")} value={prospect.phone} />
          <DetailRow label={t("common.email")} value={prospect.email} />
          <DetailRow
            label={t("common.website")}
            value={
              prospect.website_url ? (
                <a
                  href={`/visit?url=${encodeURIComponent(prospect.website_url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {prospect.website_url} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            label={t("detail.auditScore")}
            value={prospect.audit_score !== null ? `${prospect.audit_score}/100` : "—"}
          />
          <DetailRow
            label={t("common.status")}
            value={
              <Badge variant="outline" className="uppercase">
                {prospect.status}
              </Badge>
            }
          />
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("detail.emailExample")}</h2>
        </div>
        {auditIssues.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("detail.emailIncludesList")}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("detail.generatingEmail")}
          </p>
        ) : error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : subject && body ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.subject")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText("subject", subject)}
                  className="h-7 gap-1 text-xs"
                >
                  {copied === "subject" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied === "subject" ? t("common.copied") : t("detail.copySubject")}
                </Button>
              </div>
              <p className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {subject}
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.message")}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyText("body", body)}
                    className="h-7 gap-1 text-xs"
                  >
                    {copied === "body" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied === "body" ? t("common.copied") : t("detail.copyBody")}
                  </Button>
                  {fullMail ? (
                    <Button
                      size="sm"
                      onClick={() => copyText("full", fullMail)}
                      className="h-7 gap-1 text-xs"
                    >
                      {copied === "full" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied === "full" ? t("common.copied") : t("detail.copyAll")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <pre className="mt-1 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 px-3 py-3 text-sm leading-relaxed">
                {body}
              </pre>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("detail.noContent")}</p>
        )}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}
