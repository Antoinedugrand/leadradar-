export type ProspectScoreLabel = "hot" | "warm" | "cold";

export interface ScoreBreakdownItem {
  criterion: string;
  deduction: number;
  triggered: boolean;
}

export interface WebsiteAnalysisResult {
  reachable: boolean;
  https: boolean;
  mobileFriendly: boolean;
  pageSpeedScore: number | null;
  hasSocialLinks: boolean;
  outdatedTech: string[];
  brokenLinkCount: number;
  crawlErrorCount: number;
}

export interface ProspectScoreInput {
  websiteUrl: string | null;
  websiteExists?: boolean;
  googleReviewCount: number | null;
  googleRating: number | null;
  websiteAnalysis?: WebsiteAnalysisResult | null;
}

export interface ProspectScoreResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
  label: ProspectScoreLabel;
}
