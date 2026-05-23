"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/types";

interface LanguageSwitchProps {
  variant?: "light" | "dark";
  showOnMobile?: boolean;
}

export function LanguageSwitch({ variant = "light", showOnMobile = false }: LanguageSwitchProps) {
  const { locale, setLocale } = useLocale();

  function select(next: Locale) {
    setLocale(next);
  }

  const isDark = variant === "dark";

  return (
    <div
      className={`lang-switch${showOnMobile ? "" : " hide-mobile"}`}
      role="group"
      aria-label="Language"
      style={
        isDark
          ? { background: "rgba(255,255,255,0.06)" }
          : undefined
      }
    >
      {(["en", "fr"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            className={active ? "active" : ""}
            onClick={() => select(code)}
            aria-pressed={active}
            style={
              isDark
                ? {
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  }
                : undefined
            }
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
