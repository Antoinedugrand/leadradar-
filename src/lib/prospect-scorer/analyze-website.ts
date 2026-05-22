import type { WebsiteAnalysisResult } from "@/lib/prospect-scorer/types";

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
          headers: { "User-Agent": "LeadSiteBot/1.0" },
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

async function fetchPageSpeedScore(url: string, apiKey: string): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.set("category", "performance");
    endpoint.searchParams.set("key", apiKey);

    const response = await fetch(endpoint.toString(), { signal: controller.signal });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      lighthouseResult?: { categories?: { performance?: { score?: number } } };
    };
    const raw = data.lighthouseResult?.categories?.performance?.score;
    if (typeof raw !== "number") return null;
    return Math.round(raw * 100);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeWebsite(
  url: string,
  options?: { pageSpeedApiKey?: string },
): Promise<WebsiteAnalysisResult> {
  const parsed = new URL(url);
  const https = parsed.protocol === "https:";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let html = "";
  let reachable = false;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "LeadSiteBot/1.0 (+https://leadsite.local)" },
    });
    reachable = response.ok;
    if (reachable) {
      html = await response.text();
    }
  } catch {
    reachable = false;
  } finally {
    clearTimeout(timeout);
  }

  if (!reachable) {
    return {
      reachable: false,
      https,
      mobileFriendly: false,
      pageSpeedScore: null,
      hasSocialLinks: false,
      outdatedTech: [],
      brokenLinkCount: 0,
      crawlErrorCount: 1,
    };
  }

  const mobileFriendly = /<meta[^>]+name=["']viewport["'][^>]+content=/i.test(html);
  const hasSocialLinks = SOCIAL_PATTERNS.some((pattern) => pattern.test(html));
  const outdatedTech = OUTDATED_PATTERNS.filter(({ pattern }) => pattern.test(html)).map(
    ({ label }) => label,
  );

  const links = extractLinks(html, url);
  const brokenLinkCount = links.length > 0 ? await checkBrokenLinks(links) : 0;
  const crawlErrorCount = brokenLinkCount + (reachable ? 0 : 1);

  let pageSpeedScore: number | null = null;
  if (options?.pageSpeedApiKey) {
    pageSpeedScore = await fetchPageSpeedScore(url, options.pageSpeedApiKey);
  }

  return {
    reachable: true,
    https,
    mobileFriendly,
    pageSpeedScore,
    hasSocialLinks,
    outdatedTech,
    brokenLinkCount,
    crawlErrorCount,
  };
}
