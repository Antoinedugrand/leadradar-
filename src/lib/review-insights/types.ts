export interface GooglePlaceReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

export interface ReviewQuote {
  author: string;
  rating: number;
  text: string;
  when: string;
}

export interface ReviewInsights {
  fetched_at: string;
  google_rating: number | null;
  google_review_count: number | null;
  reviews_sampled: number;
  negative_reviews_count: number;
  /** Synthèse courte pour la prospection */
  summary: string;
  /** Points d'amélioration actionnables (service, accueil, qualité…) */
  improvement_points: string[];
  /** Critiques liées au site web, réservation en ligne, etc. */
  website_improvements: string[];
  /** Critiques liées au service sur place */
  service_improvements: string[];
  /** Extraits d'avis négatifs utiles */
  negative_quotes: ReviewQuote[];
}
