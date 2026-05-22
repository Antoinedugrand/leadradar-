"use client";

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-provider";

export function EmailEditorClient() {
  const { t } = useLocale();

  const defaultTemplate = `${t("emailEditor.defaultSubject")}

${t("emailEditor.defaultGreeting")}

${t("emailEditor.defaultIntro", { type: t("emailEditor.varType"), city: t("emailEditor.varCity"), name: t("emailEditor.varName") })}

${t("emailEditor.defaultBody", { issue: t("emailEditor.varIssue") })}

${t("emailEditor.defaultOffer")}

${t("emailEditor.defaultClosing")}
${t("emailEditor.varSender")}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("emailEditor.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("emailEditor.subtitle")}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> {t("emailEditor.variables")}
        </Badge>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <Textarea className="h-80 font-mono text-sm" defaultValue={defaultTemplate} />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("emailEditor.help")}{" "}
          <code className="rounded bg-muted px-1 py-0.5">{t("emailEditor.varName")}</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">{t("emailEditor.varCity")}</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">{t("emailEditor.varType")}</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">{t("emailEditor.varIssue")}</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">{t("emailEditor.varSender")}</code>.
        </p>
      </div>
    </>
  );
}
