"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface AuditProspectButtonProps {
  prospectId: string;
  websiteUrl: string | null;
}

export function AuditProspectButton({ prospectId, websiteUrl }: AuditProspectButtonProps) {
  const router = useRouter();
  const { t } = useLocale();
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
        body: JSON.stringify({ prospectId, websiteUrl }),
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

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!websiteUrl || isLoading}
        onClick={handleAudit}
        className="h-8 gap-1.5 text-xs"
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
