export type ProspectStatus = "new" | "audited" | "emailed" | "replied" | "converted";

/** Suivi commercial une fois le prospect marqué comme contacté. */
export type ContactPipeline = "waiting_reply" | "project_done";

/** Plus bas = prospect plus chaud (besoin web). */
import type { ReviewInsights } from "@/lib/review-insights/types";

export type ProspectScoreLabel = "hot" | "warm" | "cold";

export interface ScoreBreakdownItem {
  criterion: string;
  deduction: number;
  triggered: boolean;
}

export interface Prospect {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  website_exists: boolean;
  audit_score: number | null;
  /** Score commercial 0–100 (bas = chaud). Voir ProspectScorer. */
  prospect_score: number | null;
  score_breakdown: ScoreBreakdownItem[] | null;
  score_label: ProspectScoreLabel | null;
  google_rating: number | null;
  google_review_count: number | null;
  /** Analyse des avis Google négatifs (migration 0004). */
  review_insights?: ReviewInsights | null;
  audit_summary: string | null;
  audit_issues: string[] | null;
  screenshot_url: string | null;
  status: ProspectStatus;
  google_place_id: string | null;
  created_at: string;
  emailed_at: string | null;
  /** Présent après migration Supabase `0002_add_contact_pipeline`. */
  contact_pipeline?: ContactPipeline | null;
  /** Maquette HTML générée pour les établissements sans site (migration 0005). */
  generated_site_html?: string | null;
  generated_site_at?: string | null;
}

export interface SiteAuditResult {
  design_score: number;
  mobile_score: number;
  trust_score: number;
  global_score: number;
  issues: string[];
}
