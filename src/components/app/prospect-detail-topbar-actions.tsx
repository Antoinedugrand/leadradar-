"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Wand2 } from "lucide-react";

import { EmailDialog } from "@/components/email-dialog";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Prospect } from "@/lib/types";

interface ProspectDetailTopbarActionsProps {
  prospect: Prospect;
}

export function ProspectDetailTopbarActions({ prospect }: ProspectDetailTopbarActionsProps) {
  const { t } = useLocale();

  return (
    <>
      <Link href="/map-search" className="lr-btn lr-btn-ghost">
        <ArrowLeft size={14} style={{ transform: "rotate(0deg)" }} />
        {t("detail.backToMap")}
      </Link>
      <EmailDialog
        prospect={prospect}
        trigger={
          <button type="button" className="lr-btn lr-btn-secondary">
            <Mail size={14} />
            {t("map.emailAi")}
          </button>
        }
      />
      {!prospect.website_exists || !prospect.website_url ? (
        <GenerateSiteDialog
          prospect={prospect}
          trigger={
            <button type="button" className="lr-btn lr-btn-gradient">
              <Wand2 size={14} />
              {t("siteGen.generate")}
            </button>
          }
        />
      ) : null}
    </>
  );
}
