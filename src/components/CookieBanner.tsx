"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CookieBanner() {
  const { consent, ready, settingsOpen, acceptAll, rejectAll, updateConsent, openSettings, closeSettings } =
    useCookieConsent();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setAnalyticsEnabled(consent?.analytics ?? false);
    }
  }, [settingsOpen, consent?.analytics]);

  const showBanner = ready && consent === null && !settingsOpen;

  return (
    <>
      {showBanner ? (
        <div
          role="region"
          aria-label="Bandeau de consentement aux cookies"
          className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur-md sm:p-5"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Cookies sur LeadRadar</p>
              <p className="mt-1">
                Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre
                accord, des cookies analytiques (Vercel Analytics).{" "}
                <Link href="/legal/cookies" className="text-indigo-600 underline-offset-2 hover:underline">
                  En savoir plus
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={rejectAll}>
                Refuser
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={openSettings}>
                Personnaliser
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={acceptAll}
              >
                Tout accepter
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={settingsOpen} onOpenChange={(open) => (open ? openSettings() : closeSettings())}>
        <DialogContent aria-describedby="cookie-settings-desc">
          <DialogHeader>
            <DialogTitle>Préférences cookies</DialogTitle>
            <DialogDescription id="cookie-settings-desc">
              Choisissez les cookies que vous autorisez. Les cookies nécessaires ne peuvent pas être
              désactivés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Cookies nécessaires</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Session, authentification, langue et mémorisation de vos choix.
                </p>
              </div>
              <span
                className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                aria-label="Toujours activé"
              >
                Toujours ON
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Cookies analytiques</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vercel Analytics — mesure d&apos;audience agrégée, sans publicité.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <span className="sr-only">Activer les cookies analytiques</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-indigo-600"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                />
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeSettings}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => updateConsent(analyticsEnabled)}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  const { openSettings } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openSettings}
      className={className}
      aria-label="Gérer mes préférences cookies"
    >
      Gérer mes cookies
    </button>
  );
}
