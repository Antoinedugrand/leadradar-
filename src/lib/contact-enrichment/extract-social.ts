import type { FetchedPage } from "./types";
import type { SocialLink } from "@/lib/types";

interface PlatformRule {
  platform: string;
  hostPattern: RegExp;
}

const PLATFORM_RULES: PlatformRule[] = [
  { platform: "instagram", hostPattern: /(^|\.)instagram\.com$/i },
  { platform: "facebook", hostPattern: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i },
  { platform: "twitter", hostPattern: /(^|\.)twitter\.com$|(^|\.)x\.com$/i },
  { platform: "linkedin", hostPattern: /(^|\.)linkedin\.com$/i },
  { platform: "tiktok", hostPattern: /(^|\.)tiktok\.com$/i },
  { platform: "youtube", hostPattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { platform: "pinterest", hostPattern: /(^|\.)pinterest\.com$/i },
  { platform: "yelp", hostPattern: /(^|\.)yelp\.com$|(^|\.)yelp\.fr$/i },
  { platform: "tripadvisor", hostPattern: /(^|\.)tripadvisor\.(com|fr|co\.uk)$/i },
  { platform: "snapchat", hostPattern: /(^|\.)snapchat\.com$/i },
  { platform: "threads", hostPattern: /(^|\.)threads\.net$/i },
  { platform: "whatsapp", hostPattern: /(^|\.)whatsapp\.com$|(^|\.)wa\.me$/i },
  { platform: "telegram", hostPattern: /(^|\.)t\.me$|(^|\.)telegram\.me$/i },
  { platform: "discord", hostPattern: /(^|\.)discord\.(gg|com)$/i },
  { platform: "behance", hostPattern: /(^|\.)behance\.net$/i },
  { platform: "linktree", hostPattern: /(^|\.)linktr\.ee$/i },
  { platform: "dribbble", hostPattern: /(^|\.)dribbble\.com$/i },
  { platform: "github", hostPattern: /(^|\.)github\.com$/i },
  { platform: "medium", hostPattern: /(^|\.)medium\.com$/i },
  { platform: "vimeo", hostPattern: /(^|\.)vimeo\.com$/i },
  { platform: "spotify", hostPattern: /(^|\.)open\.spotify\.com$/i },
  { platform: "google_business", hostPattern: /(^|\.)google\.com$/i },
];

const OTHER_SOCIAL_HOSTS = [
  /(^|\.)allmylinks\.com$/i,
  /(^|\.)bio\.link$/i,
  /(^|\.)campsite\.bio$/i,
  /(^|\.)linkin\.bio$/i,
  /(^|\.)beacons\.ai$/i,
  /(^|\.)messenger\.com$/i,
  /(^|\.)foursquare\.com$/i,
  /(^|\.)trustpilot\.com$/i,
  /(^|\.)maps\.app\.goo\.gl$/i,
  /goo\.gl\/maps/i,
];

const BLOCKED_PATH_PATTERNS = [
  /\/sharer/i,
  /\/share\b/i,
  /\/intent\//i,
  /\/login/i,
  /\/signin/i,
  /\/signup/i,
  /\/register/i,
  /\/shareArticle/i,
  /\/dialog\//i,
  /\/plugins\//i,
  /\/tr\?/i,
  /\/privacy/i,
  /\/policies/i,
  /\/help\//i,
  /\/watch\?v=/i,
  /\/embed\//i,
];

const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"];

function extractHrefLinks(html: string, baseUrl: string): string[] {
  const hrefs = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]?.trim() ?? "");
  const unique = new Set<string>();

  for (const href of hrefs) {
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      unique.add(new URL(href, baseUrl).toString());
    } catch {
      // ignore invalid URLs
    }
  }

  return [...unique];
}

function normalizeSocialUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isBlockedSocialPath(pathname: string): boolean {
  return BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function classifySocialUrl(rawUrl: string): SocialLink | null {
  const normalized = normalizeSocialUrl(rawUrl);
  if (!normalized) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  if (isBlockedSocialPath(parsed.pathname)) {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./i, "");

  for (const rule of PLATFORM_RULES) {
    if (rule.hostPattern.test(host) || rule.hostPattern.test(parsed.hostname)) {
      if (rule.platform === "google_business" && !parsed.pathname.includes("/maps")) {
        continue;
      }
      if (rule.platform === "youtube" && parsed.pathname === "/") {
        continue;
      }
      return { platform: rule.platform, url: normalized };
    }
  }

  const isOtherSocial = OTHER_SOCIAL_HOSTS.some(
    (pattern) => pattern.test(host) || pattern.test(parsed.href),
  );
  if (isOtherSocial) {
    return { platform: "other", url: normalized, label: host };
  }

  return null;
}

function dedupeSocialLinks(links: SocialLink[]): SocialLink[] {
  const seen = new Set<string>();
  const result: SocialLink[] = [];

  for (const link of links) {
    const key = `${link.platform}:${link.url.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(link);
  }

  return result;
}

export function extractSocialLinksFromHtml(html: string, baseUrl: string): SocialLink[] {
  const hrefs = extractHrefLinks(html, baseUrl);
  const links = hrefs
    .map((href) => classifySocialUrl(href))
    .filter((link): link is SocialLink => link !== null);

  return dedupeSocialLinks(links);
}

export function extractSocialLinksFromPages(pages: FetchedPage[]): SocialLink[] {
  const links: SocialLink[] = [];

  for (const page of pages) {
    links.push(...extractSocialLinksFromHtml(page.html, page.url));
  }

  return dedupeSocialLinks(links);
}

export function mergeSocialLinks(
  existing: SocialLink[] | null | undefined,
  incoming: SocialLink[] | null | undefined,
): SocialLink[] | null {
  if (!incoming || incoming.length === 0) {
    return existing?.length ? existing : null;
  }

  if (!existing || existing.length === 0) {
    return incoming;
  }

  return dedupeSocialLinks([...existing, ...incoming]);
}
