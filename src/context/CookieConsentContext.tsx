"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const COOKIE_CONSENT_KEY = "cookie_consent";

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  timestamp: number;
}

interface CookieConsentContextValue {
  consent: CookieConsent | null;
  ready: boolean;
  settingsOpen: boolean;
  updateConsent: (analytics: boolean) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.necessary !== true || typeof parsed.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistConsent(analytics: boolean): CookieConsent {
  const value: CookieConsent = {
    necessary: true,
    analytics,
    timestamp: Date.now(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
  return value;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setReady(true);
  }, []);

  const updateConsent = useCallback((analytics: boolean) => {
    const next = persistConsent(analytics);
    setConsent(next);
    setSettingsOpen(false);
  }, []);

  const acceptAll = useCallback(() => updateConsent(true), [updateConsent]);
  const rejectAll = useCallback(() => updateConsent(false), [updateConsent]);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const value = useMemo(
    () => ({
      consent,
      ready,
      settingsOpen,
      updateConsent,
      acceptAll,
      rejectAll,
      openSettings,
      closeSettings,
    }),
    [consent, ready, settingsOpen, updateConsent, acceptAll, rejectAll, openSettings, closeSettings],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
