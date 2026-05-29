import { mergeSocialLinks } from "@/lib/contact-enrichment";
import type { Prospect, SocialLink } from "@/lib/types";

export function resolveSocialLinksUpdate(
  existing: SocialLink[] | null | undefined,
  incoming: SocialLink[] | null | undefined,
): SocialLink[] | null | undefined {
  const merged = mergeSocialLinks(existing, incoming ?? null);
  const existingCount = existing?.length ?? 0;
  const mergedCount = merged?.length ?? 0;

  if (mergedCount > existingCount) {
    return merged;
  }

  return undefined;
}

export function buildScoreUpdatePayload(
  prospect: Prospect,
  scoreData: {
    score: number;
    breakdown: Prospect["score_breakdown"];
    label: Prospect["score_label"];
    socialLinks?: SocialLink[];
  },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    prospect_score: scoreData.score,
    score_breakdown: scoreData.breakdown,
    score_label: scoreData.label,
  };

  const socialUpdate = resolveSocialLinksUpdate(prospect.social_links, scoreData.socialLinks);
  if (socialUpdate) {
    payload.social_links = socialUpdate;
  }

  return payload;
}
