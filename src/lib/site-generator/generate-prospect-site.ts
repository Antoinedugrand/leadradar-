import { getServerEnv } from "@/lib/env";
import {
  buildContentPrompt,
  buildSiteGeneratorInput,
  extractJsonPayload,
  fallbackSiteContent,
  normalizeSiteContent,
  safeJsonParse,
} from "@/lib/site-generator/content";
import { fetchPlaceEnrichment, resolveMapsUrl } from "@/lib/site-generator/place-enrichment";
import { renderSiteHtml } from "@/lib/site-generator/render-template";
import type { GeneratedSiteResult, SiteContent } from "@/lib/site-generator/types";
import type { Prospect } from "@/lib/types";

export async function generateProspectSite(prospect: Prospect): Promise<GeneratedSiteResult> {
  const env = getServerEnv();
  const enrichment = await fetchPlaceEnrichment(prospect.google_place_id, env.GOOGLE_PLACES_API_KEY);
  const input = buildSiteGeneratorInput(prospect, enrichment);

  let content: SiteContent;
  let fallback = false;

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 900,
        messages: [{ role: "user", content: buildContentPrompt(input) }],
      }),
    });

    if (!anthropicResponse.ok) {
      content = fallbackSiteContent(input);
      fallback = true;
    } else {
      const anthropicData = (await anthropicResponse.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const rawText = anthropicData.content?.find((item) => item.type === "text")?.text ?? "";
      const parsed = safeJsonParse<Partial<SiteContent>>(extractJsonPayload(rawText));
      const normalized = parsed ? normalizeSiteContent(parsed, input) : null;

      if (!normalized) {
        content = fallbackSiteContent(input);
        fallback = true;
      } else {
        content = normalized;
      }
    }
  } catch {
    content = fallbackSiteContent(input);
    fallback = true;
  }

  const mapsUrl = resolveMapsUrl(enrichment, prospect.address, prospect.city, prospect.name);
  const html = renderSiteHtml({
    input,
    content,
    mapsUrl,
  });

  return { html, content, fallback };
}
