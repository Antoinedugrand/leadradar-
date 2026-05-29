"use client";

import { LanguageDropdown } from "@/components/language-dropdown";

interface LanguageSwitchProps {
  variant?: "light" | "dark";
  showOnMobile?: boolean;
}

export function LanguageSwitch({ variant = "light", showOnMobile = false }: LanguageSwitchProps) {
  return <LanguageDropdown variant={variant} showOnMobile={showOnMobile} />;
}
