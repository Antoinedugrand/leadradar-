"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gauge, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface AuditProspectButtonProps {
  prospectId: string;
  websiteUrl: string | null;
  className?: string;
  leadRadar?: boolean;
  iconOnly?: boolean;
}

export function AuditProspectButton({
  prospectId,
  websiteUrl,
  className,
  leadRadar = false,
  iconOnly = false,
}: AuditProspectButtonProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAudit() {
    if (!websiteUrl) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, websiteUrl, language: locale }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("audit.failed"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setIsLoading(false);
    }
  }

  if (leadRadar) {
    return (
      <button
        type="button"
        disabled={!websiteUrl || isLoading}
        onClick={handleAudit}
        className={cn(
          iconOnly ? "lr-btn lr-btn-icon bordered" : "lr-btn lr-btn-ghost lr-btn-sm",
          className,
        )}
        title={error ?? (iconOnly ? t("audit.audit") : undefined)}
      >
        {isLoading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Gauge size={iconOnly ? 13 : 11} />
        )}
        {iconOnly ? null : isLoading ? t("audit.auditing") : t("audit.audit")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!websiteUrl || isLoading}
        onClick={handleAudit}
        className={cn("h-8 gap-1.5 text-xs", className)}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {isLoading ? t("audit.auditing") : t("audit.audit")}
      </Button>
      {error ? <span className="text-[11px] text-destructive">{error}</span> : null}
    </div>
  );
}
