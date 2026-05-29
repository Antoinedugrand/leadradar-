export async function fetchPageSpeedScore(url: string, apiKey: string): Promise<number | null> {
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
