"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/lib/i18n/locale-provider";
import { ProspectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContactToggleButtonProps {
  prospectId: string;
  status: ProspectStatus;
  hasAudit: boolean;
  onStatusChange?: (nextStatus: ProspectStatus) => void;
}

function isContactedStatus(status: ProspectStatus): boolean {
  return status === "emailed" || status === "replied" || status === "converted";
}

export function ContactToggleButton({
  prospectId,
  status,
  hasAudit,
  onStatusChange,
}: ContactToggleButtonProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [localStatus, setLocalStatus] = useState(status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const isContacted = isContactedStatus(localStatus);
  const fallbackStatus: ProspectStatus = hasAudit ? "audited" : "new";

  async function toggleContacted() {
    setIsLoading(true);
    setError(null);

    const nextContacted = !isContacted;
    let optimisticStatus: ProspectStatus = localStatus;

    if (nextContacted) {
      if (localStatus === "new" || localStatus === "audited") {
        optimisticStatus = "emailed";
      }
    } else if (isContactedStatus(localStatus)) {
      optimisticStatus = fallbackStatus;
    }

    const previousStatus = localStatus;
    setLocalStatus(optimisticStatus);

    try {
      const response = await fetch(`/api/prospects/${prospectId}/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacted: nextContacted,
          currentStatus: status,
          fallbackStatus,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLocalStatus(previousStatus);
        setError(payload.error ?? t("common.failed"));
        return;
      }

      onStatusChange?.(optimisticStatus);
      router.refresh();
    } catch {
      setLocalStatus(previousStatus);
      setError(t("common.networkError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isLoading}
        onClick={toggleContacted}
        title={isContacted ? t("contact.markNotContacted") : t("contact.markContacted")}
        className={cn(
          "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
          isContacted
            ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        {isLoading ? "…" : isContacted ? t("contact.contacted") : t("contact.notContacted")}
      </button>
      {error ? <span className="text-[10px] text-destructive">{error}</span> : null}
    </div>
  );
}
