import type { GooglePlaceReview } from "@/lib/review-insights/types";

interface PlaceDetailsReviewsResponse {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{
      author_name?: string;
      rating?: number;
      text?: string;
      relative_time_description?: string;
    }>;
  };
  status?: string;
  error_message?: string;
}

export interface FetchGoogleReviewsResult {
  reviews: GooglePlaceReview[];
  googleRating: number | null;
  googleReviewCount: number | null;
}

const MAX_NEGATIVE_RATING = 3;

export function isNegativeReview(rating: number): boolean {
  return rating > 0 && rating <= MAX_NEGATIVE_RATING;
}

export async function fetchGooglePlaceReviews(
  placeId: string,
  apiKey: string,
): Promise<FetchGoogleReviewsResult> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,reviews");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("language", "fr");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Impossible de contacter l'API Google Places.");
  }

  const data = (await response.json()) as PlaceDetailsReviewsResponse;
  if (data.status !== "OK" || !data.result) {
    throw new Error(data.error_message ?? "Détails Google Places indisponibles pour ce lieu.");
  }

  const reviews: GooglePlaceReview[] = (data.result.reviews ?? [])
    .filter((review) => typeof review.rating === "number" && review.text?.trim())
    .map((review) => ({
      author_name: review.author_name ?? "Client",
      rating: review.rating as number,
      text: review.text?.trim() ?? "",
      relative_time_description: review.relative_time_description ?? "",
    }));

  return {
    reviews,
    googleRating: data.result.rating ?? null,
    googleReviewCount: data.result.user_ratings_total ?? null,
  };
}

export function filterNegativeReviews(reviews: GooglePlaceReview[]): GooglePlaceReview[] {
  return reviews.filter((review) => isNegativeReview(review.rating));
}
