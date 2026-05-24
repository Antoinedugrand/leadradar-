"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gauge, Loader2, Mail, Send, Sparkles, Wand2 } from "lucide-react";
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
import type { Prospect } from "@/lib/types";

interface EmailDialogProps {
  prospect: Prospect;
  trigger?: React.ReactNode;
}

interface PitchEmail {
  subject: string;
  body: string;
  cached?: boolean;
}

export function EmailDialog({ prospect, trigger }: EmailDialogProps) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState<PitchEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | "full" | null>(null);

  useEffect(() => {
    if (!open) {
      setPitch(null);
      return;
    }
    if (pitch) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/prospects/${prospect.id}/pitch-email?language=${locale}`);
        const data = (await res.json()) as PitchEmail & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? t("emailDialog.generateError"));
          return;
        }
        setPitch(data);
        setEditedSubject(data.subject);
        setEditedBody(data.body);
      } catch {
        if (!cancelled) setError(t("common.networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, pitch, prospect.id, locale, t]);

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
                <span className="lr-pill">{t("emailDialog.variablesAi")}</span>
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
              <button type="button" className="lr-btn lr-btn-ghost" disabled>
                <Wand2 size={13} /> {t("emailEditor.regenerateAi")}
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
