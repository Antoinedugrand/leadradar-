export type Locale = "en" | "fr";

export const LOCALES: Locale[] = ["en", "fr"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "leadsite_locale";

import type { messages } from "./en";

export type TranslationKey = keyof typeof messages;
