"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Gauge, Loader2, Mail, Plus, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import {
  LrDialog,
  LrDialogBody,
  LrDialogContent,
  LrDialogFoot,
  LrDialogHead,
  LrDialogTrigger,
} from "@/components/app/lr-dialog";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getEmailVariables } from "@/lib/pitch-email/email-variables";
import type { PitchAngle } from "@/lib/pitch-email/generate-pitch";
import type { Prospect } from "@/lib/types";

interface EmailDialogProps {
  prospect: Prospect;
  trigger?: React.ReactNode;
}

interface PitchEmail {
  subject: string;
  body: string;
  cached?: boolean;
  fallback?: boolean;
  angle?: PitchAngle;
}

export function EmailDialog({ prospect, trigger }: EmailDialogProps) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState<PitchEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | "full" | null>(null);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const variablesRef = useRef<HTMLDivElement>(null);

  const emailVariables = getEmailVariables(prospect, locale);

  const applyPitch = useCallback((data: PitchEmail) => {
    setPitch(data);
    setEditedSubject(data.subject);
    setEditedBody(data.body);
    if (data.fallback) {
      toast.info(t("emailDialog.fallback"));
    }
  }, [t]);

  const loadPitch = useCallback(
    async (regenerate = false) => {
      if (regenerate) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = regenerate
          ? await fetch(`/api/prospects/${prospect.id}/pitch-email?language=${locale}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ regenerate: true }),
            })
          : await fetch(`/api/prospects/${prospect.id}/pitch-email?language=${locale}`);

        const data = (await res.json()) as PitchEmail & { error?: string };
        if (!res.ok) {
          setError(data.error ?? t("emailDialog.generateError"));
          return;
        }
        applyPitch(data);
      } catch {
        setError(t("common.networkError"));
      } finally {
        if (regenerate) {
          setRegenerating(false);
        } else {
          setLoading(false);
        }
      }
    },
    [applyPitch, locale, prospect.id, t],
  );

  useEffect(() => {
    if (!open) {
      setPitch(null);
      setVariablesOpen(false);
      return;
    }
    if (pitch) return;

    void loadPitch(false);
  }, [open, pitch, loadPitch]);

  useEffect(() => {
    if (!variablesOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!variablesRef.current?.contains(event.target as Node)) {
        setVariablesOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setVariablesOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [variablesOpen]);

  async function copy(label: "subject" | "body" | "full", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(t("emailDialog.copiedClipboard"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("emailDialog.copyFailed"));
    }
  }

  async function copyVariableValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("emailDialog.copiedClipboard"));
    } catch {
      toast.error(t("emailDialog.copyFailed"));
    }
  }

  function insertAtCursor(text: string) {
    const textarea = bodyRef.current;
    if (!textarea) {
      setEditedBody((current) => `${current}${text}`);
      return;
    }

    const start = textarea.selectionStart ?? editedBody.length;
    const end = textarea.selectionEnd ?? editedBody.length;
    const next = `${editedBody.slice(0, start)}${text}${editedBody.slice(end)}`;
    setEditedBody(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  const fullMail =
    editedSubject && editedBody
      ? t("detail.subjectPrefix", { subject: editedSubject, body: editedBody })
      : null;

  const context = !prospect.website_exists
    ? t("emailDialog.noWebsite")
    : prospect.audit_score !== null
      ? t("emailDialog.auditBased", { score: prospect.audit_score ?? 0 })
      : t("emailDialog.generic");

  const hasDemo = Boolean(prospect.generated_site_html);

  return (
    <LrDialog open={open} onOpenChange={setOpen}>
      <LrDialogTrigger asChild>
        {trigger ?? (
          <button type="button" className="lr-btn lr-btn-secondary lr-btn-sm">
            <Mail size={13} /> {t("map.emailAi")}
          </button>
        )}
      </LrDialogTrigger>
      <LrDialogContent maxWidth={680}>
        <LrDialogHead
          icon={<Mail size={18} />}
          title={t("emailDialog.title", { name: prospect.name })}
          description={context}
        />

        {loading ? (
          <LrDialogBody>
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--slate-500)]">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("emailDialog.generating")}
            </div>
          </LrDialogBody>
        ) : error ? (
          <LrDialogBody>
            <p className="py-8 text-center text-sm text-[var(--red)]">{error}</p>
          </LrDialogBody>
        ) : pitch ? (
          <>
            <LrDialogBody>
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className="lr-pill"
                  style={{
                    background: "rgba(67,56,202,0.08)",
                    color: "var(--indigo)",
                    borderColor: "rgba(67,56,202,0.18)",
                  }}
                >
                  <Gauge size={11} /> {t("emailDialog.contextAudit")}
                </span>

                <div ref={variablesRef} className="relative">
                  <button
                    type="button"
                    className="lr-pill cursor-pointer"
                    aria-expanded={variablesOpen}
                    onClick={() => setVariablesOpen((current) => !current)}
                  >
                    {t("emailDialog.variablesAi")}
                  </button>

                  {variablesOpen ? (
                    <div
                      className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[320px] rounded-[12px] border border-[var(--slate-200)] bg-white p-3 shadow-lg"
                      role="dialog"
                      aria-label={t("emailDialog.variablesTitle")}
                    >
                      <div className="mb-2 text-xs font-semibold text-[var(--slate-700)]">
                        {t("emailDialog.variablesTitle")}
                      </div>
                      <div className="flex flex-col gap-2">
                        {emailVariables.map((variable) => (
                          <div
                            key={variable.token}
                            className="rounded-[8px] border border-[var(--slate-200)] bg-[var(--slate-50)] p-2.5"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-[var(--indigo)]">
                                {variable.token}
                              </span>
                              <span className="text-[11px] text-[var(--slate-500)]">
                                {variable.label}
                              </span>
                            </div>
                            <p className="mb-2 text-[12px] leading-snug text-[var(--slate-800)]">
                              {variable.value}
                            </p>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                className="lr-btn lr-btn-secondary lr-btn-sm"
                                onClick={() => insertAtCursor(variable.token)}
                              >
                                <Plus size={11} /> {t("emailDialog.insertVariable")}
                              </button>
                              <button
                                type="button"
                                className="lr-btn lr-btn-ghost lr-btn-sm"
                                onClick={() => void copyVariableValue(variable.value)}
                              >
                                <Copy size={11} /> {t("emailDialog.copyVariable")}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {hasDemo ? (
                  <span
                    className="lr-pill"
                    style={{
                      background: "rgba(16,185,129,0.10)",
                      color: "#047857",
                      borderColor: "rgba(16,185,129,0.22)",
                    }}
                  >
                    <Check size={11} /> {t("emailDialog.mockupAttached")}
                  </span>
                ) : null}
              </div>

              <label className="lr-label">{t("detail.subject")}</label>
              <input
                className="lr-input mb-4"
                value={editedSubject}
                onChange={(event) => setEditedSubject(event.target.value)}
              />

              <label className="lr-label">{t("detail.message")}</label>
              <textarea
                ref={bodyRef}
                className="lr-input lr-textarea-mono min-h-[220px] text-[13px]"
                value={editedBody}
                onChange={(event) => setEditedBody(event.target.value)}
              />

              <p className="lr-hint mt-2">
                <Sparkles size={11} className="mr-1 inline align-[-1px]" />
                {t("emailDialog.regenerateHint")}
              </p>
            </LrDialogBody>

            <LrDialogFoot>
              <button
                type="button"
                className="lr-btn lr-btn-ghost"
                disabled={regenerating}
                onClick={() => void loadPitch(true)}
              >
                {regenerating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Wand2 size={13} />
                )}{" "}
                {regenerating ? t("emailDialog.regenerating") : t("emailEditor.regenerateAi")}
              </button>
              <span className="spacer" />
              <button
                type="button"
                className="lr-btn lr-btn-secondary"
                onClick={() => fullMail && copy("full", fullMail)}
              >
                {copied === "full" ? <Check size={13} /> : <Copy size={13} />}
                {t("emailDialog.copyAll")}
              </button>
              {prospect.email ? (
                <a
                  href={`mailto:${prospect.email}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`}
                  className="lr-btn lr-btn-gradient"
                >
                  <Send size={13} /> {t("emailDialog.openMail")}
                </a>
              ) : null}
            </LrDialogFoot>
          </>
        ) : null}
      </LrDialogContent>
    </LrDialog>
  );
}
