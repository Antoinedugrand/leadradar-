import { getServerEnv } from "@/lib/env";
import {
  inferBusinessTypeFromPages,
  inferBusinessTypeWithClaude,
  isGenericPlaceType,
} from "@/lib/business-type";
import type { Locale } from "@/lib/i18n/types";

import { enrichProspectContacts } from "./enrich-contacts";
import { fetchWebsitePages } from "./fetch-pages";
import type { EnrichBatchOptions, EnrichProspectInput, EnrichedContacts } from "./types";

export interface BatchEnrichInput extends EnrichProspectInput {
  id?: string;
  google_place_id?: string;
  googleType?: string | null;
  address?: string | null;
  city?: string | null;
  existingBusinessTypeLabel?: string | null;
  locale?: Locale;
}

export interface BatchEnrichResult extends EnrichedContacts {
  google_place_id?: string;
  businessTypeLabel?: string | null;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const current = next++;
      results[current] = await tasks[current]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export async function enrichProspectsBatch(
  inputs: BatchEnrichInput[],
  options: EnrichBatchOptions = {},
): Promise<BatchEnrichResult[]> {
  const concurrency = options.concurrency ?? 5;
  const aiCap = options.aiCap ?? 30;
  const typeAiCap = options.typeAiCap ?? 30;

  let anthropicApiKey: string | undefined;
  try {
    anthropicApiKey = getServerEnv().ANTHROPIC_API_KEY;
  } catch {
    anthropicApiKey = undefined;
  }

  const heuristicResults = await runWithConcurrency(
    inputs.map((input) => async () => {
      const pages = input.websiteUrl ? await fetchWebsitePages(input.websiteUrl) : [];
      const enriched = await enrichProspectContacts(
        { ...input, allowAi: false },
        { pages },
      );
      return {
        input,
        pages,
        enriched,
      };
    }),
    concurrency,
  );

  const needsAi = heuristicResults.filter(
    (item) => !item.enriched.email && item.input.websiteUrl && anthropicApiKey,
  );
  const aiTargets = needsAi.slice(0, aiCap);

  const aiEnrichedByIndex = new Map<number, EnrichedContacts>();

  await runWithConcurrency(
    aiTargets.map((item) => async () => {
      const originalIndex = heuristicResults.indexOf(item);
      const enriched = await enrichProspectContacts(
        { ...item.input, allowAi: true },
        { pages: item.pages, anthropicApiKey },
      );
      aiEnrichedByIndex.set(originalIndex, enriched);
    }),
    Math.min(3, aiTargets.length || 1),
  );

  const typeTargets = heuristicResults
    .filter(
      (item) =>
        anthropicApiKey &&
        isGenericPlaceType(item.input.googleType) &&
        !item.input.existingBusinessTypeLabel?.trim(),
    )
    .slice(0, typeAiCap);

  const typeLabelsByIndex = new Map<number, string>();

  await runWithConcurrency(
    typeTargets.map((item) => async () => {
      const originalIndex = heuristicResults.indexOf(item);
      const inferInput = {
        name: item.input.businessName ?? "Business",
        address: item.input.address,
        city: item.input.city,
        googleType: item.input.googleType,
        locale: item.input.locale,
      };
      const label =
        item.pages.length > 0
          ? await inferBusinessTypeFromPages(anthropicApiKey!, inferInput, item.pages)
          : await inferBusinessTypeWithClaude(anthropicApiKey!, inferInput);
      if (label) {
        typeLabelsByIndex.set(originalIndex, label);
      }
    }),
    Math.min(3, typeTargets.length || 1),
  );

  return heuristicResults.map((item, index) => {
    const finalEnriched = aiEnrichedByIndex.get(index) ?? item.enriched;
    return {
      ...finalEnriched,
      google_place_id: item.input.google_place_id,
      businessTypeLabel: typeLabelsByIndex.get(index) ?? null,
    };
  });
}
