"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadProspectsExcel } from "@/lib/export-prospects";
import type { Prospect } from "@/lib/types";

interface ExportProspectsButtonProps {
  prospects: Prospect[];
  filenameBase?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

export function ExportProspectsButton({
  prospects,
  filenameBase = "prospects_leadsite",
  className,
  variant = "outline",
}: ExportProspectsButtonProps) {
  const { locale, t } = useLocale();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={className ?? "gap-1.5"}
      disabled={prospects.length === 0}
      onClick={() => downloadProspectsExcel(prospects, filenameBase, locale)}
    >
      <Download className="h-3.5 w-3.5" />
      {t("export.button", { count: prospects.length })}
    </Button>
  );
}
