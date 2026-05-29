import { combinePagesText } from "./fetch-pages";
import type { FetchedPage } from "./types";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

interface AiContactResult {
  email: string | null;
  phone: string | null;
  confidence: "high" | "medium" | "low";
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

function isValidEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

export async function extractAiContacts(
  anthropicApiKey: string,
  businessName: string,
  pages: FetchedPage[],
): Promise<AiContactResult | null> {
  if (pages.length === 0) {
    return null;
  }

  const pageText = combinePagesText(pages, 8000);
  if (pageText.length < 40) {
    return null;
  }

  const prompt = `Tu extrais les coordonnées de contact publiques d'un établissement local depuis le texte de son site web.

Règles strictes :
- Ne JAMAIS inventer d'email ou de téléphone absent du texte.
- Exclure noreply@, no-reply@, emails techniques (wordpress, sentry, wix).
- Préférer l'email de contact professionnel visible (contact@, info@, hello@).
- Si aucun email clair n'est visible, retourne "email": null.
- Téléphone : numéro local/international tel qu'affiché sur le site, ou null.

Retourne STRICTEMENT un JSON valide (pas de markdown) :
{
  "email": "contact@example.com" | null,
  "phone": "+33 1 23 45 67 89" | null,
  "confidence": "high" | "medium" | "low"
}

Établissement : ${businessName}
Texte du site :
${pageText}`;

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
        max_tokens: 300,
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
    const parsed = safeJsonParse<AiContactResult>(extractJsonPayload(rawText));
    if (!parsed) {
      return null;
    }

    const email =
      parsed.email && isValidEmail(parsed.email) ? parsed.email.toLowerCase().trim() : null;
    const phone = parsed.phone?.trim() || null;

    if (!email && !phone) {
      return null;
    }

    if (parsed.confidence === "low" && !email) {
      return phone ? { email: null, phone, confidence: "low" } : null;
    }

    return { email, phone, confidence: parsed.confidence ?? "medium" };
  } catch {
    return null;
  }
}
