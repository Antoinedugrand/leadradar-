"use client";

import { useMemo } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";

import { landingEn, type LandingCopy } from "./en";
import { landingFr } from "./fr";

export type { LandingCopy };

export function getLandingCopy(locale: "en" | "fr"): LandingCopy {
  return locale === "fr" ? landingFr : landingEn;
}

export function useLandingCopy(): LandingCopy {
  const { locale } = useLocale();
  return useMemo(() => getLandingCopy(locale), [locale]);
}
