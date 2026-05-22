"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Globe, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Globe className="h-3 w-3" /> {t("siteGen.button")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("siteGen.title", { name: prospect.name })}
          </DialogTitle>
          <DialogDescription>{t("siteGen.description")}</DialogDescription>
        </DialogHeader>

        {loading && !previewUrl ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("siteGen.generating")}
          </div>
        ) : error ? (
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-destructive">{error}</p>
            <div className="flex justify-center">
              <Button type="button" onClick={() => generate(false)} className="gap-1.5">
                <Sparkles className="h-4 w-4" /> {t("siteGen.retry")}
              </Button>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {usedFallback ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                  {t("siteGen.fallback")}
                </Badge>
              ) : null}
              {wasCached ? (
                <Badge variant="outline">{t("siteGen.cached")}</Badge>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
              <iframe
                title={t("siteGen.previewTitle", { name: prospect.name })}
                src={previewUrl}
                className="h-[420px] w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generate(true)}
                disabled={regenerating}
                className="gap-1.5"
              >
                {regenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {regenerating ? t("siteGen.regenerating") : t("siteGen.regenerate")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {t("siteGen.copyLink")}
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" /> {t("siteGen.openPreview")}
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="max-w-md text-center text-sm text-muted-foreground">{t("siteGen.emptyHint")}</p>
            <Button type="button" onClick={() => generate(false)} className="gap-1.5">
              <Sparkles className="h-4 w-4" /> {t("siteGen.generate")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
