"use client";

import { useRouter } from "next/navigation";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/types";

export function AppLanguageSwitch() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();

  function select(next: Locale) {
    setLocale(next);
    router.refresh();
  }

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {(["en", "fr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={locale === code ? "active" : ""}
          onClick={() => select(code)}
          aria-pressed={locale === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
