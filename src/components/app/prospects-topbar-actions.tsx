"use client";

import { Download, Filter } from "lucide-react";

import { ResetProspectsButton } from "@/components/app/reset-prospects-button";
import { AuditAllButton } from "@/components/audit-all-button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadProspectsExcel } from "@/lib/export-prospects";
import type { Prospect } from "@/lib/types";

interface ProspectsTopbarActionsProps {
  prospects: Prospect[];
}

export function ProspectsTopbarActions({ prospects }: ProspectsTopbarActionsProps) {
  const { t, locale } = useLocale();

  return (
    <>
      <button type="button" className="lr-btn lr-btn-ghost" disabled title={t("prospects.filterSoon")}>
        <Filter size={14} />
        {t("prospects.filter")}
      </button>
      <button
        type="button"
        className="lr-btn lr-btn-secondary"
        disabled={prospects.length === 0}
        onClick={() => downloadProspectsExcel(prospects, "prospects_leadsite", locale)}
      >
        <Download size={14} />
        {t("export.button", { count: prospects.length })}
      </button>
      <ResetProspectsButton scope="active" disabled={prospects.length === 0} />
      <AuditAllButton prospects={prospects} leadRadar className="justify-center" />
    </>
  );
}
