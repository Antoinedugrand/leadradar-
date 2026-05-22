"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface AuditTarget {
  id: string;
  website_url: string | null;
  audit_score: number | null;
  name?: string;
}

interface AuditAllButtonProps {
  prospects: AuditTarget[];
  onProgress?: (done: number, total: number) => void;
  onCompleted?: () => void;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function AuditAllButton({
  prospects,
  onProgress,
  onCompleted,
  variant = "secondary",
  className,
}: AuditAllButtonProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  const targets = prospects.filter(
    (p) => Boolean(p.website_url) && p.audit_score === null,
  );

  async function runAll() {
    if (targets.length === 0) {
      toast.info(t("audit.noneNew"));
      return;
    }

    setRunning(true);
    setTotal(targets.length);
    setDone(0);

    let success = 0;
    let stopped = false;

    for (const target of targets) {
      if (!target.website_url) continue;
      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospectId: target.id,
            websiteUrl: target.website_url,
          }),
        });
        if (res.status === 429) {
          toast.warning(t("audit.limitReached"));
          stopped = true;
          break;
        }
        if (res.ok) success += 1;
      } catch {
        // continue
      }
      const next = success;
      setDone(next);
      onProgress?.(next, targets.length);
      await new Promise((r) => setTimeout(r, 800));
    }

    setRunning(false);
    if (!stopped) {
      toast.success(t("audit.doneToast", { count: success }));
    }
    onCompleted?.();
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={runAll}
      disabled={running || targets.length === 0}
      className={`gap-2 ${className ?? ""}`}
      title={
        targets.length === 0
          ? t("audit.none")
          : t("audit.toAudit", { count: targets.length })
      }
    >
      {running ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {running
        ? t("audit.progress", { done, total })
        : targets.length > 0
          ? t("audit.allCount", { count: targets.length })
          : t("audit.all")}
    </Button>
  );
}
