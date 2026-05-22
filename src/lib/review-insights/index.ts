import { analyzeNegativeReviews } from "@/lib/review-insights/analyze-reviews";
import {
  fetchGooglePlaceReviews,
  filterNegativeReviews,
} from "@/lib/review-insights/fetch-google-reviews";
import type { ReviewInsights } from "@/lib/review-insights/types";

export type { GooglePlaceReview, ReviewInsights, ReviewQuote } from "@/lib/review-insights/types";

export async function fetchAndAnalyzeReviews(params: {
  googlePlaceId: string;
  prospectName: string;
  googleApiKey: string;
  anthropicApiKey: string;
}): Promise<ReviewInsights> {
  const { reviews, googleRating, googleReviewCount } = await fetchGooglePlaceReviews(
    params.googlePlaceId,
    params.googleApiKey,
  );

  const negativeReviews = filterNegativeReviews(reviews);

  return analyzeNegativeReviews({
    prospectName: params.prospectName,
    negativeReviews,
    reviewsSampled: reviews.length,
    googleRating,
    googleReviewCount,
    anthropicApiKey: params.anthropicApiKey,
  });
}
