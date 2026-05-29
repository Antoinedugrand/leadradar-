"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type ResetScope = "active" | "contacted";

interface ResetProspectsButtonProps {
  scope: ResetScope;
  disabled?: boolean;
  className?: string;
}

export function ResetProspectsButton({ scope, disabled, className }: ResetProspectsButtonProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  const confirmKey = scope === "active" ? "prospects.resetConfirm" : "contacted.resetConfirm";
  const successKey = scope === "active" ? "prospects.resetSuccess" : "contacted.resetSuccess";
  const errorKey = scope === "active" ? "prospects.resetError" : "contacted.resetError";
  const labelKey = scope === "active" ? "prospects.reset" : "contacted.reset";

  async function handleReset() {
    if (!window.confirm(t(confirmKey))) return;

    setLoading(true);
    try {
      const response = await fetch("/api/prospects/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = (await response.json()) as { error?: string; count?: number };
      if (!response.ok) {
        toast.error(data.error ?? t(errorKey));
        return;
      }

      toast.success(t(successKey, { count: data.count ?? 0 }));
      router.refresh();
    } catch {
      toast.error(t(errorKey));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={cn("lr-btn lr-btn-secondary", className)}
      disabled={disabled || loading}
      onClick={handleReset}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
      {t(labelKey)}
    </button>
  );
}
