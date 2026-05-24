"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  LayoutDashboard,
  Mail,
  Map,
  Search,
  Send,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { AppLanguageSwitch } from "@/components/app/app-language-switch";
import { LogoMark } from "@/components/app/logo-mark";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  prospectsCount: number;
  contactedCount: number;
}

type NavItem = {
  href: string;
  labelKey:
    | "nav.dashboard"
    | "nav.search"
    | "nav.map"
    | "nav.prospects"
    | "nav.contacted"
    | "nav.email"
    | "nav.settings";
  icon: React.ComponentType<{ className?: string; size?: number }>;
  count?: number;
  live?: boolean;
  match?: (pathname: string) => boolean;
};

const workspaceItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard",
  },
];

const prospectingItems: NavItem[] = [
  {
    href: "/search",
    labelKey: "nav.search",
    icon: Search,
    match: (pathname) => pathname.startsWith("/search"),
  },
  {
    href: "/map-search",
    labelKey: "nav.map",
    icon: Map,
    live: true,
    match: (pathname) => pathname.startsWith("/map-search"),
  },
  {
    href: "/prospects",
    labelKey: "nav.prospects",
    icon: Target,
    match: (pathname) => pathname.startsWith("/prospects"),
  },
  {
    href: "/contacted",
    labelKey: "nav.contacted",
    icon: Mail,
    match: (pathname) => pathname.startsWith("/contacted"),
  },
];

const toolItems: NavItem[] = [
  {
    href: "/email-editor",
    labelKey: "nav.email",
    icon: Send,
    match: (pathname) => pathname.startsWith("/email-editor"),
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: SlidersHorizontal,
    match: (pathname) => pathname.startsWith("/settings"),
  },
];

function NavLink({
  item,
  pathname,
  count,
  label,
}: {
  item: NavItem;
  pathname: string;
  count?: number;
  label: string;
}) {
  const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn("lr-nav-item", isActive && "active")}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="lr-nav-ico">
        <Icon size={17} />
      </span>
      {label}
      {count != null && count > 0 ? <span className="lr-nav-count">{count}</span> : null}
      {item.live ? (
        <span
          className="lr-nav-count"
          style={{
            background: "rgba(6,182,212,0.14)",
            color: "#0E7490",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: "#06B6D4",
              display: "inline-block",
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          Live
        </span>
      ) : null}
    </Link>
  );
}

export function AppSidebar({ prospectsCount, contactedCount }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  const counts: Partial<Record<NavItem["labelKey"], number>> = {
    "nav.prospects": prospectsCount,
    "nav.contacted": contactedCount,
  };

  return (
    <aside className="lr-sidebar">
      <Link href="/dashboard" className="lr-brand">
        <LogoMark size={30} />
        <span className="lr-brand-name">{t("nav.brand")}</span>
      </Link>

      <div className="lr-group-label">{t("nav.workspace")}</div>
      {workspaceItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          label={t(item.labelKey)}
        />
      ))}

      <div className="lr-group-label">{t("nav.prospecting")}</div>
      {prospectingItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          count={counts[item.labelKey]}
          label={t(item.labelKey)}
        />
      ))}

      <div className="lr-group-label">{t("nav.tools")}</div>
      {toolItems.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} label={t(item.labelKey)} />
      ))}

      <div className="lr-sidebar-bottom">
        <AppLanguageSwitch />
        <div className="lr-user">
          <div className="lr-user-av">
            <Gauge size={14} />
          </div>
          <div className="lr-user-meta">
            <div className="lr-user-name">{t("nav.brand")}</div>
            <div className="lr-user-email">{t("nav.workspace")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
