"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { ProspectAvatar } from "@/components/app/prospect-avatar";
import {
  LrDialog,
  LrDialogBody,
  LrDialogContent,
  LrDialogFoot,
  LrDialogHead,
  LrDialogTrigger,
} from "@/components/app/lr-dialog";
import { TypeBadge } from "@/components/app/type-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Prospect } from "@/lib/types";

interface GenerateSiteDialogProps {
  prospect: Prospect;
  trigger?: React.ReactNode;
  onGenerated?: (previewUrl: string) => void;
}

interface GenerateSiteResponse {
  previewUrl?: string;
  cached?: boolean;
  fallback?: boolean;
  generatedAt?: string;
  exists?: boolean;
  error?: string;
}

export function GenerateSiteDialog({ prospect, trigger, onGenerated }: GenerateSiteDialogProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [wasCached, setWasCached] = useState(false);
  const [copied, setCopied] = useState(false);

  const canGenerate = !prospect.website_exists || !prospect.website_url;

  useEffect(() => {
    if (!open || !canGenerate) return;

    let cancelled = false;

    async function loadExisting() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/prospects/${prospect.id}/generate-site`);
        const data = (await res.json()) as GenerateSiteResponse;
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? t("siteGen.generateError"));
          return;
        }

        if (data.exists && data.previewUrl) {
          setPreviewUrl(data.previewUrl);
          setWasCached(true);
          onGenerated?.(data.previewUrl);
        }
      } catch {
        if (!cancelled) setError(t("common.networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadExisting();
    return () => {
      cancelled = true;
    };
  }, [open, canGenerate, prospect.id, onGenerated, t]);

  async function generate(regenerate = false) {
    if (!canGenerate) return;

    if (regenerate) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/prospects/${prospect.id}/generate-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      const data = (await res.json()) as GenerateSiteResponse;

      if (!res.ok) {
        setError(data.error ?? t("siteGen.generateError"));
        return;
      }

      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        setUsedFallback(Boolean(data.fallback));
        setWasCached(Boolean(data.cached));
        onGenerated?.(data.previewUrl);
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }

  async function copyLink() {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      toast.success(t("siteGen.copiedLink"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("emailDialog.copyFailed"));
    }
  }

  if (!canGenerate) {
    return null;
  }

  const previewHost = previewUrl
    ? (() => {
        try {
          return new URL(previewUrl).host;
        } catch {
          return previewUrl;
        }
      })()
    : null;

  return (
    <LrDialog open={open} onOpenChange={setOpen}>
      <LrDialogTrigger asChild>
        {trigger ?? (
          <button type="button" className="lr-btn lr-btn-secondary lr-btn-sm">
            <Wand2 size={13} /> {t("siteGen.button")}
          </button>
        )}
      </LrDialogTrigger>
      <LrDialogContent maxWidth={760}>
        <LrDialogHead
          icon={<Wand2 size={18} />}
          title={t("siteGen.title", { name: prospect.name })}
          description={
            previewUrl ? t("siteGen.previewReady") : t("siteGen.description")
          }
        />

        {loading && !previewUrl && !error ? (
          <LrDialogBody>
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-[var(--slate-500)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("siteGen.generating")}
            </div>
          </LrDialogBody>
        ) : error ? (
          <>
            <LrDialogBody>
              <p className="py-6 text-center text-sm text-[var(--red)]">{error}</p>
            </LrDialogBody>
            <LrDialogFoot>
              <span className="spacer" />
              <button type="button" className="lr-btn lr-btn-gradient" onClick={() => generate(false)}>
                <Sparkles size={13} /> {t("siteGen.retry")}
              </button>
            </LrDialogFoot>
          </>
        ) : previewUrl ? (
          <>
            <LrDialogBody>
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className="lr-pill"
                  style={{
                    background: "rgba(67,56,202,0.08)",
                    color: "var(--indigo)",
                    borderColor: "rgba(67,56,202,0.18)",
                  }}
                >
                  <Sparkles size={11} /> {t("siteGen.aiVersion")}
                </span>
                {usedFallback ? (
                  <span
                    className="lr-pill"
                    style={{
                      background: "rgba(245,158,11,0.10)",
                      color: "#B45309",
                      borderColor: "rgba(245,158,11,0.22)",
                    }}
                  >
                    {t("siteGen.fallback")}
                  </span>
                ) : null}
                {wasCached ? (
                  <span
                    className="lr-pill"
                    style={{
                      background: "rgba(16,185,129,0.10)",
                      color: "#047857",
                      borderColor: "rgba(16,185,129,0.22)",
                    }}
                  >
                    <Check size={11} /> {t("siteGen.shareableLink")}
                  </span>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--slate-200)] bg-[var(--slate-100)]">
                <div className="flex items-center gap-2 border-b border-[var(--slate-100)] bg-white px-3 py-2">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                    <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2 w-2 rounded-full bg-[#28C840]" />
                  </span>
                  <div className="lr-mono mx-auto max-w-[320px] truncate rounded bg-[var(--slate-100)] px-2.5 py-0.5 text-[11px] text-[var(--slate-500)]">
                    {previewHost}
                  </div>
                </div>
                <iframe
                  title={t("siteGen.previewTitle", { name: prospect.name })}
                  src={previewUrl}
                  className="h-[420px] w-full bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </LrDialogBody>

            <LrDialogFoot>
              <button
                type="button"
                className="lr-btn lr-btn-ghost"
                onClick={() => generate(true)}
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )}
                {regenerating ? t("siteGen.regenerating") : t("siteGen.regenerate")}
              </button>
              <button type="button" className="lr-btn lr-btn-ghost" onClick={copyLink}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {t("siteGen.copyLink")}
              </button>
              <span className="spacer" />
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lr-btn lr-btn-secondary"
              >
                <Eye size={13} /> {t("siteGen.openPreview")}
              </a>
            </LrDialogFoot>
          </>
        ) : (
          <>
            <LrDialogBody>
              <div className="mb-4 rounded-xl border border-[var(--slate-100)] bg-[var(--slate-50)] p-4">
                <div className="mb-3 flex items-start gap-3">
                  <ProspectAvatar name={prospect.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-[var(--slate-900)]">
                      {prospect.name}
                    </div>
                    <div className="text-xs text-[var(--slate-500)]">{prospect.address ?? "—"}</div>
                  </div>
                  <GoogleRatingBadge
                    rating={prospect.google_rating}
                    reviewCount={prospect.google_review_count}
                  />
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--slate-600)]">
                  {t("siteGen.emptyHint")}
                </p>
                {prospect.type ? (
                  <div className="mt-2">
                    <TypeBadge type={prospect.type} t={t} />
                  </div>
                ) : null}
              </div>
            </LrDialogBody>
            <LrDialogFoot>
              <button type="button" className="lr-btn lr-btn-ghost" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </button>
              <span className="spacer" />
              <button type="button" className="lr-btn lr-btn-gradient lr-btn-lg" onClick={() => generate(false)}>
                <Wand2 size={14} /> {t("siteGen.generate")}
              </button>
            </LrDialogFoot>
          </>
        )}
      </LrDialogContent>
    </LrDialog>
  );
}
