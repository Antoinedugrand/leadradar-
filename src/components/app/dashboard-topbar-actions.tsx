"use client";

import Link from "next/link";
import { Clock, Download, Zap } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadProspectsExcel } from "@/lib/export-prospects";
import type { Prospect } from "@/lib/types";

interface DashboardTopbarActionsProps {
  prospects: Prospect[];
}

export function DashboardTopbarActions({ prospects }: DashboardTopbarActionsProps) {
  const { locale, t } = useLocale();

  return (
    <>
      <button type="button" className="lr-btn lr-btn-ghost">
        <Clock size={14} />
        {t("dashboard.thisWeek")}
      </button>
      <button
        type="button"
        className="lr-btn lr-btn-secondary"
        disabled={prospects.length === 0}
        onClick={() => downloadProspectsExcel(prospects, "dashboard_prospects", locale)}
      >
        <Download size={14} />
        {t("export.button", { count: prospects.length })}
      </button>
      <Link href="/map-search" className="lr-btn lr-btn-gradient">
        <Zap size={14} />
        {t("dashboard.startSearch")}
      </Link>
    </>
  );
}
