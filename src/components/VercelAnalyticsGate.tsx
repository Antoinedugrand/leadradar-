"use client";

import { Analytics } from "@vercel/analytics/react";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export function VercelAnalyticsGate() {
  const { consent, ready } = useCookieConsent();

  if (!ready || !consent?.analytics) {
    return null;
  }

  return <Analytics />;
}
