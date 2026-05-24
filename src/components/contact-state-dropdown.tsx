"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { ContactPipeline, ProspectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ContactStateValue = "not" | "contacted" | "done";

interface ContactStateDropdownProps {
  prospectId: string;
  status: ProspectStatus;
  contactPipeline?: ContactPipeline | null;
  hasAudit: boolean;
  onStatusChange?: (nextStatus: ProspectStatus, pipeline: ContactPipeline | null) => void;
}

function isContactedStatus(status: ProspectStatus): boolean {
  return status === "emailed" || status === "replied" || status === "converted";
}

export function getContactState(
  status: ProspectStatus,
  contactPipeline?: ContactPipeline | null,
): ContactStateValue {
  if (status === "converted" || contactPipeline === "project_done") {
    return "done";
  }
  if (isContactedStatus(status)) {
    return "contacted";
  }
  return "not";
}

export function ContactStateDropdown({
  prospectId,
  status,
  contactPipeline = null,
  hasAudit,
  onStatusChange,
}: ContactStateDropdownProps) {
  const router = useRouter();
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [localPipeline, setLocalPipeline] = useState<ContactPipeline | null>(contactPipeline);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(status);
    setLocalPipeline(contactPipeline ?? null);
  }, [status, contactPipeline]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const currentState = getContactState(localStatus, localPipeline);
  const fallbackStatus: ProspectStatus = hasAudit ? "audited" : "new";

  const options: { value: ContactStateValue; label: string }[] = [
    { value: "not", label: t("contact.notContacted") },
    { value: "contacted", label: t("contact.contacted") },
    { value: "done", label: t("contact.done") },
  ];

  async function applyState(next: ContactStateValue) {
    if (next === currentState || isLoading) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const previousStatus = localStatus;
    const previousPipeline = localPipeline;

    try {
      if (next === "not") {
        const response = await fetch(`/api/prospects/${prospectId}/contact`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contacted: false,
            currentStatus: localStatus,
            fallbackStatus,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? t("common.failed"));
        }
        setLocalStatus(fallbackStatus);
        setLocalPipeline(null);
        onStatusChange?.(fallbackStatus, null);
      } else if (next === "contacted") {
        const response = await fetch(`/api/prospects/${prospectId}/contact`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contacted: true,
            currentStatus: localStatus,
            fallbackStatus,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? t("common.failed"));
        }
        const nextStatus =
          localStatus === "new" || localStatus === "audited" ? "emailed" : localStatus;
        setLocalStatus(nextStatus);
        setLocalPipeline("waiting_reply");
        onStatusChange?.(nextStatus, "waiting_reply");
      } else {
        let nextStatus = localStatus;
        if (!isContactedStatus(localStatus)) {
          const contactResponse = await fetch(`/api/prospects/${prospectId}/contact`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contacted: true,
              currentStatus: localStatus,
              fallbackStatus,
            }),
          });
          const contactPayload = (await contactResponse.json()) as { error?: string };
          if (!contactResponse.ok) {
            throw new Error(contactPayload.error ?? t("common.failed"));
          }
          nextStatus = localStatus === "new" || localStatus === "audited" ? "emailed" : localStatus;
        }

        const pipelineResponse = await fetch(`/api/prospects/${prospectId}/contact-pipeline`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline: "project_done" }),
        });
        const pipelinePayload = (await pipelineResponse.json()) as { error?: string };
        if (!pipelineResponse.ok) {
          throw new Error(pipelinePayload.error ?? t("common.failed"));
        }

        setLocalStatus("converted");
        setLocalPipeline("project_done");
        onStatusChange?.("converted", "project_done");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setLocalStatus(previousStatus);
      setLocalPipeline(previousPipeline);
      setError(err instanceof Error ? err.message : t("common.networkError"));
    } finally {
      setIsLoading(false);
    }
  }

  const activeLabel = options.find((option) => option.value === currentState)?.label ?? "";

  return (
    <div className="lr-cstate" ref={ref}>
      <button
        type="button"
        disabled={isLoading}
        className={cn(
          "lr-cstate-btn",
          currentState === "contacted" && "contacted",
          currentState === "done" && "done",
        )}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <span className="dot" />
          {isLoading ? "…" : activeLabel}
        </span>
        <span className="chev">
          <ChevronDown size={14} />
        </span>
      </button>
      {open ? (
        <div className="lr-cstate-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={currentState === option.value}
              className={cn(
                "opt",
                option.value,
                currentState === option.value && "active",
              )}
              onClick={() => applyState(option.value)}
            >
              <span className="dot" />
              {option.label}
              <span className="tick">
                <Check size={12} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {error ? <span className="mt-1 block text-[10px] text-destructive">{error}</span> : null}
    </div>
  );
}
