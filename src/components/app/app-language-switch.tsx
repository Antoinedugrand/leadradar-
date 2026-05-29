"use client";

import { useRouter } from "next/navigation";

import { LanguageDropdown } from "@/components/language-dropdown";

export function AppLanguageSwitch() {
  const router = useRouter();

  return <LanguageDropdown onLocaleChange={() => router.refresh()} />;
}
