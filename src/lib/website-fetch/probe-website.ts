export type WebsiteReachability = "ok" | "blocked" | "unreachable";

export interface WebsiteProbeResult {
  reachability: WebsiteReachability;
  status: number | null;
  finalUrl: string;
  html: string | null;
  responseTimeMs: number;
}

export const BROWSER_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
};

export const DEFAULT_PROBE_TIMEOUT_MS = 15_000;

const BLOCKED_STATUSES = new Set([401, 403, 405, 429, 503]);
const UNREACHABLE_STATUSES = new Set([404, 410]);

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed.replace(/\/$/, "")}`;
}

const CONTACT_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contactez-nous",
  "/nous-contacter",
  "/about",
  "/about-us",
  "/mentions-legales",
];

export function buildContactPageUrls(websiteUrl: string): string[] {
  const baseUrl = normalizeWebsiteUrl(websiteUrl).replace(/\/$/, "");
  return [...new Set(CONTACT_PATHS.map((path) => (path ? `${baseUrl}${path}` : baseUrl)))];
}

function buildUrlVariants(url: string): string[] {
  const normalized = normalizeWebsiteUrl(url);
  const variants = new Set<string>([normalized]);

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname;

    if (host.startsWith("www.")) {
      const withoutWww = new URL(parsed.toString());
      withoutWww.hostname = host.slice(4);
      variants.add(withoutWww.toString().replace(/\/$/, ""));
    } else {
      const withWww = new URL(parsed.toString());
      withWww.hostname = `www.${host}`;
      variants.add(withWww.toString().replace(/\/$/, ""));
    }

    if (parsed.protocol === "https:") {
      const httpUrl = new URL(parsed.toString());
      httpUrl.protocol = "http:";
      variants.add(httpUrl.toString().replace(/\/$/, ""));
    }
  } catch {
    // keep normalized only
  }

  return [...variants];
}

function classifyReachability(status: number | null, hasHtml: boolean): WebsiteReachability {
  if (status !== null && status >= 200 && status < 300 && hasHtml) {
    return "ok";
  }
  if (status !== null && BLOCKED_STATUSES.has(status)) {
    return "blocked";
  }
  if (status === null || UNREACHABLE_STATUSES.has(status)) {
    return "unreachable";
  }
  if (status !== null && status >= 500) {
    return "blocked";
  }
  return "unreachable";
}

interface FetchAttempt {
  status: number | null;
  finalUrl: string;
  html: string | null;
  responseTimeMs: number;
  networkError: boolean;
}

async function fetchOnce(url: string, timeoutMs: number): Promise<FetchAttempt> {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: BROWSER_FETCH_HEADERS,
    });

    const contentType = response.headers.get("content-type") ?? "";
    let html: string | null = null;

    if (
      !contentType ||
      contentType.includes("text/html") ||
      contentType.includes("text/plain") ||
      contentType.includes("application/xhtml")
    ) {
      html = await response.text();
    }

    return {
      status: response.status,
      finalUrl: response.url || url,
      html,
      responseTimeMs: performance.now() - startedAt,
      networkError: false,
    };
  } catch {
    return {
      status: null,
      finalUrl: url,
      html: null,
      responseTimeMs: performance.now() - startedAt,
      networkError: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeWebsite(
  url: string,
  options?: { timeoutMs?: number },
): Promise<WebsiteProbeResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const variants = buildUrlVariants(url);

  let bestBlocked: WebsiteProbeResult | null = null;
  let lastUnreachable: WebsiteProbeResult | null = null;

  for (const candidate of variants) {
    const attempt = await fetchOnce(candidate, timeoutMs);
    const hasHtml = Boolean(attempt.html && attempt.html.trim().length > 0);
    const reachability = classifyReachability(attempt.status, hasHtml);

    const result: WebsiteProbeResult = {
      reachability,
      status: attempt.status,
      finalUrl: attempt.finalUrl,
      html: attempt.html,
      responseTimeMs: attempt.responseTimeMs,
    };

    if (reachability === "ok") {
      return result;
    }

    if (reachability === "blocked") {
      if (!bestBlocked || (attempt.html?.length ?? 0) > (bestBlocked.html?.length ?? 0)) {
        bestBlocked = result;
      }
      continue;
    }

    lastUnreachable = result;
  }

  if (bestBlocked) {
    return bestBlocked;
  }

  return (
    lastUnreachable ?? {
      reachability: "unreachable",
      status: null,
      finalUrl: normalizeWebsiteUrl(url),
      html: null,
      responseTimeMs: 0,
    }
  );
}

export async function fetchPageHtmlWithBrowserHeaders(
  url: string,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<string | null> {
  const result = await probeWebsite(url, { timeoutMs });
  if (result.reachability === "ok" || (result.reachability === "blocked" && result.html)) {
    return result.html;
  }
  return null;
}
