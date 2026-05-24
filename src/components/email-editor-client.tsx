"use client";

import { Check, Plus, Wand2 } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";

const VARIABLES = [
  "{nom_etablissement}",
  "{ville}",
  "{type_etablissement}",
  "{probleme_principal}",
  "{expediteur_nom}",
] as const;

export function EmailEditorClient() {
  const { t } = useLocale();

  const defaultSubject = t("emailEditor.defaultSubject");
  const defaultBody = `${t("emailEditor.defaultGreeting")}

${t("emailEditor.defaultIntro", { type: t("emailEditor.varType"), city: t("emailEditor.varCity"), name: t("emailEditor.varName") })}

${t("emailEditor.defaultBody", { issue: t("emailEditor.varIssue") })}

${t("emailEditor.defaultOffer")}

${t("emailEditor.defaultClosing")}
${t("emailEditor.varSender")}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="lr-card">
        <div className="lr-card-head">
          <div className="lr-card-title">{t("emailEditor.templateTitle")}</div>
          <span className="ml-auto rounded-full bg-[rgba(67,56,202,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[var(--indigo)]">
            {t("emailEditor.variablesCount", { count: VARIABLES.length })}
          </span>
        </div>
        <div className="px-[22px] py-5">
          <label className="lr-label">{t("detail.subject")}</label>
          <input
            className="lr-input lr-mono mb-4 text-[13px]"
            defaultValue={defaultSubject}
          />

          <label className="lr-label">{t("detail.message")}</label>
          <textarea
            className="lr-input lr-textarea-mono min-h-[340px] resize-y font-mono text-[13px] leading-relaxed"
            defaultValue={defaultBody}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button type="button" className="lr-btn lr-btn-secondary lr-btn-sm" disabled>
              <Wand2 size={13} />
              {t("emailEditor.regenerateAi")}
            </button>
            <button type="button" className="lr-btn lr-btn-secondary lr-btn-sm" disabled>
              <Check size={13} />
              {t("emailEditor.copy")}
            </button>
            <span className="ml-auto text-xs text-[var(--slate-500)]">
              {t("emailEditor.autosaved")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="lr-card lr-card-pad-lg">
          <div className="lr-card-title mb-3">{t("emailEditor.variablesTitle")}</div>
          <p className="mb-3.5 text-[13px] leading-relaxed text-[var(--slate-500)]">
            {t("emailEditor.variablesHelp")}
          </p>
          <div className="flex flex-col gap-2">
            {VARIABLES.map((variable) => (
              <button
                key={variable}
                type="button"
                className="lr-btn lr-btn-secondary justify-between font-mono text-xs"
              >
                <span className="text-[var(--indigo)]">{variable}</span>
                <Plus size={12} />
              </button>
            ))}
          </div>
        </div>

        <div className="lr-card lr-card-pad-lg">
          <div className="lr-card-title mb-2">{t("emailEditor.previewTitle")}</div>
          <p className="mb-3 text-xs text-[var(--slate-500)]">{t("emailEditor.previewHint")}</p>
          <div className="rounded-[10px] border border-[var(--slate-200)] bg-[var(--slate-50)] p-3.5 text-[13px] leading-relaxed text-[var(--slate-800)]">
            <div className="mb-2 font-semibold text-[var(--slate-900)]">{defaultSubject}</div>
            <p className="text-[var(--slate-700)]">{t("emailEditor.previewBody")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
