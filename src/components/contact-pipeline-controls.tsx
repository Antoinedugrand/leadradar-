"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { ContactPipeline } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContactPipelineControlsProps {
  prospectId: string;
  pipeline: ContactPipeline | null | undefined;
}

export function ContactPipelineControls({ prospectId, pipeline }: ContactPipelineControlsProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState<ContactPipeline | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effective: ContactPipeline =
    pipeline === "project_done" ? "project_done" : "waiting_reply";

  async function setPipeline(next: ContactPipeline) {
    setLoading(next);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/contact-pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("common.failed"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPipeline("waiting_reply")}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
            effective === "waiting_reply"
              ? "border-amber-500/40 bg-amber-500/15 text-amber-900"
              : "border-border bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          {loading === "waiting_reply" ? "…" : t("contacted.pending")}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPipeline("project_done")}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
            effective === "project_done"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-900"
              : "border-border bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          {loading === "project_done" ? "…" : t("contacted.done")}
        </button>
      </div>
      {error ? <span className="text-[11px] text-destructive">{error}</span> : null}
    </div>
  );
}
