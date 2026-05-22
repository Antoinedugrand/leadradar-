"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();

  if (locale === "en") {
    return null;
  }

  function switchToEnglish() {
    setLocale("en");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={switchToEnglish}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
        "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
        className,
      )}
      aria-label={t("lang.en")}
    >
      <Languages className="h-4 w-4" aria-hidden />
      {t("lang.en")}
    </button>
  );
}
