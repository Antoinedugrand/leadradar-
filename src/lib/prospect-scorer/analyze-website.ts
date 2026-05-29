import { extractSocialLinksFromHtml } from "@/lib/contact-enrichment/extract-social";
import type { WebsiteAnalysisResult } from "@/lib/prospect-scorer/types";
import type { SocialLink } from "@/lib/types";
import { fetchPageSpeedScore } from "@/lib/website-fetch/pagespeed";
import { BROWSER_FETCH_HEADERS, probeWebsite } from "@/lib/website-fetch/probe-website";

const SOCIAL_PATTERNS = [
  /facebook\.com\//i,
  /instagram\.com\//i,
  /twitter\.com\//i,
  /x\.com\//i,
  /linkedin\.com\//i,
  /tiktok\.com\//i,
  /youtube\.com\//i,
];

const OUTDATED_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Flash", pattern: /<object[^>]+application\/x-shockwave-flash/i },
  { label: "Flash embed", pattern: /\.swf["']/i },
  { label: "jQuery 1.x", pattern: /jquery[.-]1\.\d+/i },
  { label: "jQuery 2.x", pattern: /jquery[.-]2\.\d+/i },
  { label: "Table layout", pattern: /<table[^>]*>[\s\S]{0,200}<\/table>/i },
  { label: "Marquee", pattern: /<marquee/i },
  { label: "Frameset", pattern: /<frameset/i },
];

function extractLinks(html: string, baseUrl: string): string[] {
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
    if (unique.size >= 20) break;
  }

  return [...unique].slice(0, 20);
}

async function checkBrokenLinks(links: string[]): Promise<number> {
  let broken = 0;

  await Promise.all(
    links.map(async (link) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(link, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
          headers: BROWSER_FETCH_HEADERS,
        });
        if (!response.ok && response.status !== 405) {
          broken += 1;
        }
      } catch {
        broken += 1;
      } finally {
        clearTimeout(timeout);
      }
    }),
  );

  return broken;
}

export async function analyzeWebsite(
  url: string,
  options?: { pageSpeedApiKey?: string },
): Promise<WebsiteAnalysisResult> {
  const parsed = new URL(url);
  const https = parsed.protocol === "https:";
  const probe = await probeWebsite(url);
  const probedUrl = probe.finalUrl || url;
  const html = probe.html ?? "";
  const reachable = probe.reachability !== "unreachable";
  const hasHtml = html.trim().length > 0;

  if (!reachable) {
    return {
      reachable: false,
      https,
      mobileFriendly: false,
      pageSpeedScore: null,
      hasSocialLinks: false,
      socialLinks: [],
      outdatedTech: [],
      brokenLinkCount: 0,
      crawlErrorCount: 1,
    };
  }

  if (!hasHtml) {
    let pageSpeedScore: number | null = null;
    if (options?.pageSpeedApiKey) {
      pageSpeedScore = await fetchPageSpeedScore(probedUrl, options.pageSpeedApiKey);
    }

    return {
      reachable: true,
      https,
      mobileFriendly: false,
      pageSpeedScore,
      hasSocialLinks: false,
      socialLinks: [],
      outdatedTech: [],
      brokenLinkCount: 0,
      crawlErrorCount: probe.reachability === "blocked" ? 0 : 1,
    };
  }

  const mobileFriendly = /<meta[^>]+name=["']viewport["'][^>]+content=/i.test(html);
  const socialLinks: SocialLink[] = extractSocialLinksFromHtml(html, probedUrl);
  const hasSocialLinks = socialLinks.length > 0 || SOCIAL_PATTERNS.some((pattern) => pattern.test(html));
  const outdatedTech = OUTDATED_PATTERNS.filter(({ pattern }) => pattern.test(html)).map(
    ({ label }) => label,
  );

  const links = extractLinks(html, probedUrl);
  const brokenLinkCount = links.length > 0 ? await checkBrokenLinks(links) : 0;
  const crawlErrorCount = brokenLinkCount + (probe.reachability === "unreachable" ? 1 : 0);

  let pageSpeedScore: number | null = null;
  if (options?.pageSpeedApiKey) {
    pageSpeedScore = await fetchPageSpeedScore(probedUrl, options.pageSpeedApiKey);
  }

  return {
    reachable: true,
    https,
    mobileFriendly,
    pageSpeedScore,
    hasSocialLinks,
    socialLinks,
    outdatedTech,
    brokenLinkCount,
    crawlErrorCount,
  };
}
