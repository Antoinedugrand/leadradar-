export interface SiteContent {
  tagline: string;
  about: string;
  services: [string, string, string];
  ctaText: string;
}

export interface PlaceEnrichment {
  editorialSummary: string | null;
  openingHours: string[] | null;
  mapsUrl: string | null;
}

export interface SiteGeneratorInput {
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  reviewSummary: string | null;
  enrichment: PlaceEnrichment;
}

export interface GeneratedSiteResult {
  html: string;
  content: SiteContent;
  fallback: boolean;
}
