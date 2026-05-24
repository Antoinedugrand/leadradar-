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
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPipeline("waiting_reply")}
          className={cn(
            "lr-toggle",
            effective === "waiting_reply" && "on",
            loading !== null && "opacity-50",
          )}
        >
          <span className="lr-toggle-track" />
          {loading === "waiting_reply" ? "…" : t("contacted.pending")}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPipeline("project_done")}
          className={cn(
            "lr-toggle",
            effective === "project_done" && "on",
            loading !== null && "opacity-50",
          )}
        >
          <span className="lr-toggle-track" />
          {loading === "project_done" ? "…" : t("contacted.done")}
        </button>
      </div>
      {error ? <span className="text-[11px] text-[var(--red)]">{error}</span> : null}
    </div>
  );
}
