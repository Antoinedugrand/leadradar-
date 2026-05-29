import { fetchWebsitePages } from "./fetch-pages";
import { extractAiContacts } from "./extract-ai";
import {
  extractHeuristicContacts,
  pickHeuristicEmail,
  pickHeuristicPhone,
} from "./extract-heuristics";
import { extractSocialLinksFromPages } from "./extract-social";
import type { ContactSource, EnrichProspectInput, EnrichedContacts, FetchedPage } from "./types";

interface EnrichContext {
  pages?: FetchedPage[];
  anthropicApiKey?: string;
}

export async function enrichProspectContacts(
  input: EnrichProspectInput,
  context: EnrichContext = {},
): Promise<EnrichedContacts> {
  const enrichedAt = new Date().toISOString();
  const googlePhone = input.googlePhone?.trim() || null;

  if (!input.websiteUrl) {
    return {
      email: null,
      phone: googlePhone,
      emailSource: null,
      phoneSource: googlePhone ? "google" : null,
      enrichedAt,
      socialLinks: [],
    };
  }

  const pages = context.pages ?? (await fetchWebsitePages(input.websiteUrl));
  const socialLinks = extractSocialLinksFromPages(pages);
  const heuristics = extractHeuristicContacts(pages);
  let email = pickHeuristicEmail(heuristics);
  let emailSource: ContactSource | null = email ? "website" : null;
  let sitePhone = pickHeuristicPhone(heuristics);

  if (!email && input.allowAi !== false && context.anthropicApiKey) {
    const aiResult = await extractAiContacts(
      context.anthropicApiKey,
      input.businessName ?? "Business",
      pages,
    );
    if (aiResult?.email) {
      email = aiResult.email;
      emailSource = "ai";
    }
    if (!sitePhone && aiResult?.phone) {
      sitePhone = aiResult.phone;
    }
  }

  const phone = googlePhone ?? sitePhone;
  let phoneSource: ContactSource | null = null;
  if (googlePhone) {
    phoneSource = "google";
  } else if (sitePhone) {
    phoneSource = emailSource === "ai" ? "ai" : "website";
  }

  return {
    email,
    phone,
    emailSource,
    phoneSource,
    enrichedAt,
    socialLinks,
  };
}
