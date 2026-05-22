"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Prospect } from "@/lib/types";

interface EmailDialogProps {
  prospect: Prospect;
  trigger?: React.ReactNode;
}

interface PitchEmail {
  subject: string;
  body: string;
  fallback?: boolean;
  cached?: boolean;
}

export function EmailDialog({ prospect, trigger }: EmailDialogProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState<PitchEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | "full" | null>(null);

  useEffect(() => {
    if (!open || pitch) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/prospects/${prospect.id}/pitch-email`);
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
  }, [open, pitch, prospect.id]);

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
    editedSubject && editedBody ? t("detail.subjectPrefix", { subject: editedSubject, body: editedBody }) : null;

  const context = !prospect.website_exists
    ? t("emailDialog.noWebsite")
    : prospect.audit_score !== null
      ? t("emailDialog.auditBased", { score: prospect.audit_score ?? 0 })
      : t("emailDialog.generic");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Mail className="h-3 w-3" /> {t("map.emailAi")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("emailDialog.title", { name: prospect.name })}
          </DialogTitle>
          <DialogDescription>{context}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("emailDialog.generating")}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-destructive">{error}</div>
        ) : pitch ? (
          <div className="space-y-4">
            {pitch.fallback ? (
              <Badge variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                {t("emailDialog.fallback")}
              </Badge>
            ) : null}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.subject")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => copy("subject", editedSubject)}
                >
                  {copied === "subject" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {t("common.copy")}
                </Button>
              </div>
              <input
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.message")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => copy("body", editedBody)}
                >
                  {copied === "body" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {t("common.copy")}
                </Button>
              </div>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={14}
                className="font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fullMail && copy("full", fullMail)}
                className="gap-1.5"
              >
                {copied === "full" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t("emailDialog.copyAll")}
              </Button>
              {prospect.email ? (
                <Button asChild className="gap-1.5">
                  <a
                    href={`mailto:${prospect.email}?subject=${encodeURIComponent(
                      editedSubject,
                    )}&body=${encodeURIComponent(editedBody)}`}
                  >
                    <Mail className="h-4 w-4" /> {t("emailDialog.openMail")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
