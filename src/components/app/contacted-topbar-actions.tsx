"use client";

import { Download } from "lucide-react";

import { ResetProspectsButton } from "@/components/app/reset-prospects-button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface ContactedTopbarActionsProps {
  exportCount: number;
  totalCount: number;
}

export function ContactedTopbarActions({ exportCount, totalCount }: ContactedTopbarActionsProps) {
  const { t } = useLocale();

  return (
    <>
      <button type="button" className="lr-btn lr-btn-secondary" disabled>
        <Download size={14} />
        {t("export.button", { count: exportCount })}
      </button>
      <ResetProspectsButton scope="contacted" disabled={totalCount === 0} />
    </>
  );
}
