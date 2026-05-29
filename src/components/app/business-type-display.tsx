"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";
import { needsBusinessTypeInference, resolveBusinessTypeLabel } from "@/lib/business-type";
import type { Prospect } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BusinessTypeDisplayProps {
  prospect: Prospect;
  className?: string;
}

export function BusinessTypeDisplay({ prospect, className }: BusinessTypeDisplayProps) {
  const { t } = useLocale();
  const [label, setLabel] = useState<string | null>(() => resolveBusinessTypeLabel(prospect, t));
  const [fromAi, setFromAi] = useState(Boolean(prospect.business_type_label?.trim()));
  const [loading, setLoading] = useState(() => needsBusinessTypeInference(prospect));

  useEffect(() => {
    const resolved = resolveBusinessTypeLabel(prospect, t);
    setLabel(resolved);
    setFromAi(Boolean(prospect.business_type_label?.trim()));
    setLoading(needsBusinessTypeInference(prospect));
  }, [prospect.id, prospect.type, prospect.business_type_label, t]);

  useEffect(() => {
    if (!needsBusinessTypeInference(prospect)) {
      return;
    }

    let cancelled = false;

    async function inferType() {
      try {
        const response = await fetch(`/api/prospects/${prospect.id}/business-type`, {
          method: "POST",
        });
        if (!response.ok || cancelled) {
          return;
        }
        const data = (await response.json()) as { label?: string | null; source?: string | null };
        if (data.label) {
          setLabel(data.label);
          setFromAi(data.source === "ai");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void inferType();

    return () => {
      cancelled = true;
    };
  }, [prospect.id, prospect.type, prospect.business_type_label]);

  if (loading) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-[var(--slate-500)]", className)}>
        <Loader2 size={13} className="animate-spin" />
        {t("detail.inferringType")}
      </span>
    );
  }

  if (!label) {
    return <span className={cn("text-[13px] text-[var(--slate-500)]", className)}>—</span>;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span className="inline-flex rounded-md border border-[var(--slate-200)] bg-[var(--slate-50)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--slate-600)]">
        {label}
      </span>
      {fromAi ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--slate-400)]">
          {t("contact.sourceAi")}
        </span>
      ) : null}
    </span>
  );
}
