import { messages as enMessages } from "./en";
import { messages as frMessages } from "./fr";
import type { Locale } from "./types";

export type { Locale, TranslationKey } from "./types";
export { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "./types";

export type Messages = typeof enMessages;
export type TFunction = (
  key: keyof Messages,
  params?: Record<string, string | number>,
) => string;

const dictionaries: Record<Locale, Record<keyof Messages, string>> = {
  en: enMessages,
  fr: frMessages,
};

export function createT(locale: Locale): TFunction {
  const dict = dictionaries[locale];
  return (key, params) => {
    let text: string = dict[key] ?? enMessages[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

export function getMessages(locale: Locale): Record<keyof Messages, string> {
  return dictionaries[locale];
}

export function parseLocale(value: string | undefined | null): Locale {
  return value === "fr" ? "fr" : "en";
}

export function placeTypeLabel(t: TFunction, value: string): string {
  const key = `placeType.${value}` as keyof Messages;
  const msg = dictionaries.en[key];
  if (msg && typeof msg === "string") {
    return t(key);
  }
  return value;
}

export const PLACE_TYPE_VALUES = [
  "restaurant",
  "lodging",
  "cafe",
  "bakery",
  "hair_care",
  "gym",
] as const;
