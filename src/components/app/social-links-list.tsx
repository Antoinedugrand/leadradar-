"use client";

import { ExternalLink, Globe, Link2, MessageCircle, Music2, Share2 } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { SocialLink } from "@/lib/types";

interface SocialLinksListProps {
  links?: SocialLink[] | null;
}

function platformIcon(platform: string) {
  switch (platform) {
    case "instagram":
    case "tiktok":
    case "youtube":
    case "vimeo":
    case "spotify":
      return Music2;
    case "whatsapp":
    case "telegram":
    case "discord":
    case "snapchat":
    case "threads":
      return MessageCircle;
    case "linktree":
      return Link2;
    default:
      return platform === "other" ? Globe : Share2;
  }
}

function platformLabel(
  link: SocialLink,
  t: (key: Parameters<ReturnType<typeof useLocale>["t"]>[0]) => string,
): string {
  if (link.platform === "other") {
    return link.label ?? link.url;
  }

  const key = `social.${link.platform}` as Parameters<typeof t>[0];
  const translated = t(key);
  return translated !== key ? translated : link.platform;
}

export function SocialLinksList({ links }: SocialLinksListProps) {
  const { t } = useLocale();
  const items = links ?? [];

  if (items.length === 0) {
    return <span className="text-[13px] text-[var(--slate-500)]">{t("detail.noSocialLinks")}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((link) => {
        const Icon = platformIcon(link.platform);
        const label = platformLabel(link, t);

        return (
          <a
            key={`${link.platform}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="lr-btn lr-btn-ghost lr-btn-sm inline-flex max-w-full items-center gap-1.5 no-underline"
          >
            <Icon size={14} />
            <span className="truncate">{label}</span>
            {link.platform === "other" ? <ExternalLink size={11} className="opacity-60" /> : null}
          </a>
        );
      })}
    </div>
  );
}
