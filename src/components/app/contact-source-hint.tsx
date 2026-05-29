"use client";

import type { ContactSource } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";

interface ContactSourceHintProps {
  source?: ContactSource | null;
}

export function ContactSourceHint({ source }: ContactSourceHintProps) {
  const { t } = useLocale();

  if (!source) {
    return null;
  }

  const labelKey =
    source === "google"
      ? "contact.sourceGoogle"
      : source === "website"
        ? "contact.sourceWebsite"
        : "contact.sourceAi";

  return (
    <span className="ml-1.5 inline-flex rounded-full bg-[var(--slate-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--slate-500)]">
      {t(labelKey as Parameters<typeof t>[0])}
    </span>
  );
}
