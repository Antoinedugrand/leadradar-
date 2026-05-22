"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const linkKeys = [
  { href: "/dashboard", key: "nav.dashboard" as const },
  { href: "/search", key: "nav.search" as const },
  { href: "/map-search", key: "nav.map" as const },
  { href: "/prospects", key: "nav.prospects" as const },
  { href: "/contacted", key: "nav.contacted" as const },
  { href: "/email-editor", key: "nav.email" as const },
  { href: "/settings", key: "nav.settings" as const },
];

export function MainNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="w-full border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3">
        <Link
          href="/dashboard"
          className="mr-2 flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-lg leading-none">{t("nav.brand")}</span>
        </Link>
        {linkKeys.map((link) => {
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {t(link.key)}
            </Link>
          );
        })}
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
