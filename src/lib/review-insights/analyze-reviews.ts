import type { GooglePlaceReview, ReviewInsights, ReviewQuote } from "@/lib/review-insights/types";

interface ClaudeReviewAnalysis {
  summary: string;
  improvement_points: string[];
  website_improvements: string[];
  service_improvements: string[];
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

function buildHeuristicAnalysis(
  prospectName: string,
  negativeReviews: GooglePlaceReview[],
): ClaudeReviewAnalysis {
  const websiteKeywords =
    /site|web|internet|en ligne|online|réservation|reservation|menu|google|page|appli|application/i;
  const websiteImprovements: string[] = [];
  const serviceImprovements: string[] = [];

  for (const review of negativeReviews) {
    const snippet = review.text.slice(0, 120);
    if (websiteKeywords.test(review.text)) {
      websiteImprovements.push(snippet);
    } else {
      serviceImprovements.push(snippet);
    }
  }

  const improvement_points = negativeReviews
    .map((r) => `(${r.rating}★) ${r.text.slice(0, 100)}${r.text.length > 100 ? "…" : ""}`)
    .slice(0, 4);

  return {
    summary:
      negativeReviews.length > 0
        ? `${prospectName} : ${negativeReviews.length} avis négatif(s) récent(s) à exploiter en prospection.`
        : `Peu d'avis négatifs visibles pour ${prospectName} dans l'échantillon Google.`,
    improvement_points,
    website_improvements: [...new Set(websiteImprovements)].slice(0, 3),
    service_improvements: [...new Set(serviceImprovements)].slice(0, 3),
  };
}

export async function analyzeNegativeReviews(params: {
  prospectName: string;
  negativeReviews: GooglePlaceReview[];
  reviewsSampled: number;
  googleRating: number | null;
  googleReviewCount: number | null;
  anthropicApiKey: string;
}): Promise<ReviewInsights> {
  const {
    prospectName,
    negativeReviews,
    reviewsSampled,
    googleRating,
    googleReviewCount,
    anthropicApiKey,
  } = params;

  const negativeQuotes: ReviewQuote[] = negativeReviews.map((review) => ({
    author: review.author_name,
    rating: review.rating,
    text: review.text,
    when: review.relative_time_description,
  }));

  if (negativeReviews.length === 0) {
    return {
      fetched_at: new Date().toISOString(),
      google_rating: googleRating,
      google_review_count: googleReviewCount,
      reviews_sampled: reviewsSampled,
      negative_reviews_count: 0,
      summary: `Aucun avis négatif (≤3★) dans les derniers avis Google visibles pour ${prospectName}.`,
      improvement_points: [],
      website_improvements: [],
      service_improvements: [],
      negative_quotes: [],
    };
  }

  const reviewsBlock = negativeReviews
    .map(
      (r, i) =>
        `[${i + 1}] ${r.rating}★ — ${r.author_name} (${r.relative_time_description}): « ${r.text} »`,
    )
    .join("\n");

  const prompt = `Tu aides un freelance web à prospecter des TPE en France.
On a extrait des avis Google NÉGATIFS (note ≤3) pour l'établissement « ${prospectName} ».
Note Google globale : ${googleRating ?? "inconnue"} (${googleReviewCount ?? "?"} avis au total).

Ta mission : isoler les critiques CONSTRUCTIVES (pas juste des insultes) et en déduire ce qu'on peut améliorer côté SERVICE et côté SITE WEB / présence en ligne.

Règles :
- "improvement_points" : 3 à 5 actions concrètes pour le gérant (accueil, délais, qualité, communication…)
- "website_improvements" : uniquement ce qui concerne le site, la réservation en ligne, les infos sur Google, le menu en ligne, etc. (vide [] si rien)
- "service_improvements" : ce qui concerne l'expérience sur place (vide [] si rien)
- "summary" : une phrase percutante (≤ 160 car.) pour la prospection
- Ignore les avis sans fond (juste une note sans texte utile)
- Réponds en français

Avis :
${reviewsBlock}

JSON strict (pas de markdown) :
{
  "summary": "…",
  "improvement_points": ["…"],
  "website_improvements": ["…"],
  "service_improvements": ["…"]
}`;

  let parsed: ClaudeReviewAnalysis | null = null;

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (anthropicResponse.ok) {
      const anthropicData = (await anthropicResponse.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const rawText = anthropicData.content?.find((item) => item.type === "text")?.text ?? "";
      parsed = safeJsonParse<ClaudeReviewAnalysis>(extractJsonPayload(rawText));
    }
  } catch {
    parsed = null;
  }

  if (!parsed) {
    parsed = buildHeuristicAnalysis(prospectName, negativeReviews);
  }

  return {
    fetched_at: new Date().toISOString(),
    google_rating: googleRating,
    google_review_count: googleReviewCount,
    reviews_sampled: reviewsSampled,
    negative_reviews_count: negativeReviews.length,
    summary: parsed.summary.trim().slice(0, 240),
    improvement_points: (parsed.improvement_points ?? []).slice(0, 6),
    website_improvements: (parsed.website_improvements ?? []).slice(0, 5),
    service_improvements: (parsed.service_improvements ?? []).slice(0, 5),
    negative_quotes: negativeQuotes.slice(0, 5),
  };
}
