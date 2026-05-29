export type Locale = "en" | "fr" | "es" | "pt" | "zh" | "hi";

export const LOCALES: Locale[] = ["en", "fr", "es", "pt", "zh", "hi"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "leadsite_locale";

export const LOCALE_OPTIONS: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "es", label: "Español", short: "ES" },
  { code: "pt", label: "Português", short: "PT" },
  { code: "zh", label: "Mandarin", short: "ZH" },
  { code: "hi", label: "Hindi", short: "HI" },
];

export const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  zh: "zh-CN",
  hi: "hi-IN",
};

import type { messages } from "./en";

export type TranslationKey = keyof typeof messages;
