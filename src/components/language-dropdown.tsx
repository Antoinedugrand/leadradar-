"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";
import { LOCALE_OPTIONS, type Locale } from "@/lib/i18n/types";

interface LanguageDropdownProps {
  variant?: "light" | "dark";
  showOnMobile?: boolean;
  onLocaleChange?: (locale: Locale) => void;
}

export function LanguageDropdown({
  variant = "light",
  showOnMobile = false,
  onLocaleChange,
}: LanguageDropdownProps) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];
  const isDark = variant === "dark";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function select(next: Locale) {
    setLocale(next);
    onLocaleChange?.(next);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`lang-dropdown${showOnMobile ? "" : " hide-mobile"}`}
      style={isDark ? { background: "rgba(255,255,255,0.06)" } : undefined}
    >
      <button
        type="button"
        className="lang-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((value) => !value)}
        style={
          isDark
            ? {
                color: "#fff",
                background: open ? "rgba(255,255,255,0.1)" : "transparent",
              }
            : undefined
        }
      >
        <span>{current.short}</span>
        <ChevronDown
          className={`lang-dropdown-chevron${open ? " open" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul className="lang-dropdown-menu" role="listbox" aria-label="Language">
          {LOCALE_OPTIONS.map((option) => {
            const active = locale === option.code;
            return (
              <li key={option.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={active ? "active" : ""}
                  onClick={() => select(option.code)}
                  style={
                    isDark
                      ? {
                          color: active ? "#fff" : "rgba(255,255,255,0.75)",
                          background: active ? "rgba(255,255,255,0.1)" : "transparent",
                        }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
