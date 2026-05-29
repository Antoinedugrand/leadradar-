import type { SocialLink } from "@/lib/types";

export type ContactSource = "google" | "website" | "ai";

export interface FetchedPage {
  url: string;
  html: string;
}

export interface HeuristicContacts {
  emails: string[];
  phones: string[];
}

export interface EnrichedContacts {
  email: string | null;
  phone: string | null;
  emailSource: ContactSource | null;
  phoneSource: ContactSource | null;
  enrichedAt: string;
  socialLinks: SocialLink[];
}

export interface EnrichProspectInput {
  businessName?: string;
  websiteUrl: string | null;
  googlePhone?: string | null;
  allowAi?: boolean;
}

export interface EnrichBatchOptions {
  /** Max concurrent website fetches (default 5). */
  concurrency?: number;
  /** Max AI fallback calls per batch (default 30). */
  aiCap?: number;
  /** Max business type AI inferences per batch (default 30). */
  typeAiCap?: number;
}
