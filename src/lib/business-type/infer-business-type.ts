import { combinePagesText } from "@/lib/contact-enrichment/fetch-pages";
import type { FetchedPage } from "@/lib/contact-enrichment/types";
import type { Locale } from "@/lib/i18n/types";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

interface InferBusinessTypeInput {
  name: string;
  address?: string | null;
  city?: string | null;
  googleType?: string | null;
  websiteText?: string;
  locale?: Locale;
}

const LANGUAGE_BY_LOCALE: Partial<Record<Locale, string>> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
};

function localeLanguage(locale: Locale): string {
  return LANGUAGE_BY_LOCALE[locale] ?? "English";
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

export async function inferBusinessTypeWithClaude(
  anthropicApiKey: string,
  input: InferBusinessTypeInput,
): Promise<string | null> {
  const locale = input.locale ?? "fr";
  const language = localeLanguage(locale);

  const prompt = `You classify local businesses for a B2B prospecting tool.

Given the business information below, return a SHORT, specific business category label (2-4 words max) in ${language}.
Examples (FR): "Barbier", "Restaurant italien", "Salon de coiffure", "Boulangerie-pâtisserie", "Cabinet dentaire".
Examples (EN): "Barbershop", "Italian restaurant", "Hair salon", "Bakery", "Dental clinic".

Rules:
- Be specific based on the business name and context (not generic like "establishment" or "store").
- Use the most likely customer-facing category.
- Do NOT invent services unrelated to the name.
- Return JSON only: { "label": "…", "confidence": "high"|"medium"|"low" }
- If truly impossible, return { "label": null, "confidence": "low" }

Business name: ${input.name}
Address: ${input.address ?? "—"}
City: ${input.city ?? "—"}
Google category hint: ${input.googleType ?? "—"}
${input.websiteText ? `Website excerpt:\n${input.websiteText.slice(0, 4000)}` : ""}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const rawText = data.content?.find((item) => item.type === "text")?.text ?? "";
    const parsed = safeJsonParse<{ label?: string | null; confidence?: string }>(
      extractJsonPayload(rawText),
    );
    const label = parsed?.label?.trim();
    if (!label || label.length > 80) {
      return null;
    }
    if (parsed?.confidence === "low" && label.length < 3) {
      return null;
    }
    return label;
  } catch {
    return null;
  }
}

export async function inferBusinessTypeFromPages(
  anthropicApiKey: string,
  input: Omit<InferBusinessTypeInput, "websiteText">,
  pages: FetchedPage[],
): Promise<string | null> {
  const websiteText = pages.length > 0 ? combinePagesText(pages, 4000) : undefined;
  return inferBusinessTypeWithClaude(anthropicApiKey, { ...input, websiteText });
}
