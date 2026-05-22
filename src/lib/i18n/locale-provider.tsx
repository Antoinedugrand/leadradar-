"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createT, type TFunction } from "./index";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
    document.documentElement.lang = next;
  }, []);

  const t = useMemo(() => createT(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
