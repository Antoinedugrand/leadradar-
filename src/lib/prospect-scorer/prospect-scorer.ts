import { analyzeWebsite } from "@/lib/prospect-scorer/analyze-website";
import type {
  ProspectScoreInput,
  ProspectScoreLabel,
  ProspectScoreResult,
  ScoreBreakdownItem,
  WebsiteAnalysisResult,
} from "@/lib/prospect-scorer/types";

const NO_WEBSITE_SCORE = 5;

interface CriterionRule {
  criterion: string;
  deduction: number;
  triggered: (input: ProspectScoreInput) => boolean;
}

function scoreLabel(score: number): ProspectScoreLabel {
  if (score <= 30) return "hot";
  if (score <= 60) return "warm";
  return "cold";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class ProspectScorer {
  constructor(private readonly pageSpeedApiKey?: string) {}

  calculateScore(input: ProspectScoreInput): ProspectScoreResult {
    const hasWebsite = Boolean(input.websiteUrl) && input.websiteExists !== false;

    if (!hasWebsite) {
      return {
        score: NO_WEBSITE_SCORE,
        label: "hot",
        breakdown: [
          {
            criterion: "Pas de site web",
            deduction: 60,
            triggered: true,
          },
        ],
      };
    }

    const analysis = input.websiteAnalysis;
    const rules: CriterionRule[] = [
      {
        criterion: "Moins de 10 avis Google",
        deduction: 15,
        triggered: () =>
          input.googleReviewCount === null || input.googleReviewCount < 10,
      },
      {
        criterion: "Note Google inférieure à 3,5★",
        deduction: 5,
        triggered: () => input.googleRating !== null && input.googleRating < 3.5,
      },
      {
        criterion: "Site non adapté mobile",
        deduction: 10,
        triggered: () => analysis !== null && analysis !== undefined && !analysis.mobileFriendly,
      },
      {
        criterion: "PageSpeed inférieur à 50",
        deduction: 5,
        triggered: () =>
          analysis?.pageSpeedScore !== null &&
          analysis?.pageSpeedScore !== undefined &&
          analysis.pageSpeedScore < 50,
      },
      {
        criterion: "Pas de HTTPS",
        deduction: 3,
        triggered: () => analysis !== null && analysis !== undefined && !analysis.https,
      },
      {
        criterion: "Design / stack obsolète",
        deduction: 5,
        triggered: () => (analysis?.outdatedTech.length ?? 0) > 0,
      },
      {
        criterion: "Aucun lien réseaux sociaux",
        deduction: 5,
        triggered: () =>
          analysis !== null && analysis !== undefined && !analysis.hasSocialLinks,
      },
      {
        criterion: "Erreurs de crawl (liens cassés)",
        deduction: 3,
        triggered: () => (analysis?.crawlErrorCount ?? 0) > 0,
      },
    ];

    let score = 100;
    const breakdown: ScoreBreakdownItem[] = rules.map((rule) => {
      const triggered = rule.triggered(input);
      if (triggered) {
        score -= rule.deduction;
      }
      return {
        criterion: rule.criterion,
        deduction: rule.deduction,
        triggered,
      };
    });

    if (analysis !== null && analysis !== undefined && !analysis.reachable) {
      score -= 20;
      breakdown.push({
        criterion: "Site inaccessible",
        deduction: 20,
        triggered: true,
      });
    }

    const finalScore = clampScore(score);

    return {
      score: finalScore,
      breakdown,
      label: scoreLabel(finalScore),
    };
  }

  async analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
    return analyzeWebsite(url, { pageSpeedApiKey: this.pageSpeedApiKey });
  }

  async scoreProspect(input: ProspectScoreInput): Promise<ProspectScoreResult> {
    if (!input.websiteUrl || input.websiteExists === false) {
      return this.calculateScore(input);
    }

    const websiteAnalysis = await this.analyzeWebsite(input.websiteUrl);
    const result = this.calculateScore({ ...input, websiteAnalysis });
    return {
      ...result,
      socialLinks: websiteAnalysis.socialLinks,
    };
  }
}

export function getScoreLabelMeta(label: ProspectScoreLabel): {
  emoji: string;
  labelKey: "score.hot" | "score.warm" | "score.cold";
  className: string;
} {
  switch (label) {
    case "hot":
      return {
        emoji: "🔴",
        labelKey: "score.hot",
        className: "border-red-500/40 bg-red-500/10 text-red-800",
      };
    case "warm":
      return {
        emoji: "🟡",
        labelKey: "score.warm",
        className: "border-amber-500/40 bg-amber-500/10 text-amber-900",
      };
    case "cold":
      return {
        emoji: "🟢",
        labelKey: "score.cold",
        className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800",
      };
  }
}

export function getDisplayScore(prospect: {
  prospect_score: number | null;
  audit_score: number | null;
}): number | null {
  return prospect.prospect_score ?? prospect.audit_score;
}

export function sortProspectsByScore<T extends { prospect_score: number | null; audit_score: number | null }>(
  prospects: T[],
): T[] {
  return [...prospects].sort((a, b) => {
    const sa = getDisplayScore(a);
    const sb = getDisplayScore(b);
    if (sa === null && sb === null) return 0;
    if (sa === null) return 1;
    if (sb === null) return -1;
    return sa - sb;
  });
}
