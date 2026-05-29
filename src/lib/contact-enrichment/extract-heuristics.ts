import type { FetchedPage, HeuristicContacts } from "./types";
import { stripHtmlToText } from "./fetch-pages";

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const BLOCKED_EMAIL_PATTERNS = [
  /noreply/i,
  /no-reply/i,
  /donotreply/i,
  /wordpress/i,
  /sentry/i,
  /wixpress/i,
  /squarespace/i,
  /example\.com/i,
  /yourdomain/i,
  /email@domain/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.webp$/i,
  /\.gif$/i,
  /\.svg$/i,
];

const PREFERRED_EMAIL_PREFIXES = ["contact", "info", "hello", "bonjour", "accueil", "admin", "office"];

function isBlockedEmail(email: string): boolean {
  return BLOCKED_EMAIL_PATTERNS.some((pattern) => pattern.test(email));
}

function deobfuscateText(text: string): string {
  return text
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s*\[\s*arobase\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*arobase\s*\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s*\[\s*point\s*\]\s*/gi, ".");
}

function extractMailtoEmails(html: string): string[] {
  const matches = html.match(/href=["']mailto:([^"'?]+)/gi) ?? [];
  return matches
    .map((match) => {
      const email = match.replace(/href=["']mailto:/i, "").trim();
      return email.split("?")[0]?.trim().toLowerCase() ?? "";
    })
    .filter((email) => email.includes("@") && !isBlockedEmail(email));
}

function extractTelPhones(html: string): string[] {
  const matches = html.match(/href=["']tel:([^"']+)/gi) ?? [];
  return matches
    .map((match) => match.replace(/href=["']tel:/i, "").trim())
    .map((phone) => phone.replace(/[^\d+().\s-]/g, "").trim())
    .filter((phone) => phone.replace(/\D/g, "").length >= 8);
}

function extractRegexEmails(text: string): string[] {
  const deobfuscated = deobfuscateText(text);
  const found = deobfuscated.match(EMAIL_REGEX) ?? [];
  return [...new Set(found.map((email) => email.toLowerCase()))].filter((email) => !isBlockedEmail(email));
}

function extractSchemaContacts(html: string): HeuristicContacts {
  const emails: string[] = [];
  const phones: string[] = [];

  const jsonLdBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of jsonLdBlocks) {
    const inner = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
    try {
      const data = JSON.parse(inner) as unknown;
      collectSchemaContacts(data, emails, phones);
    } catch {
      continue;
    }
  }

  return { emails, phones };
}

function collectSchemaContacts(node: unknown, emails: string[], phones: string[]): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectSchemaContacts(item, emails, phones);
    }
    return;
  }

  const record = node as Record<string, unknown>;
  if (typeof record.email === "string" && record.email.includes("@")) {
    const email = record.email.toLowerCase();
    if (!isBlockedEmail(email)) {
      emails.push(email);
    }
  }
  if (typeof record.telephone === "string") {
    phones.push(record.telephone.trim());
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      collectSchemaContacts(value, emails, phones);
    }
  }
}

function scoreEmail(email: string): number {
  const local = email.split("@")[0] ?? "";
  let score = 0;
  for (const prefix of PREFERRED_EMAIL_PREFIXES) {
    if (local.startsWith(prefix)) {
      score += 10;
    }
  }
  if (local.includes("contact")) {
    score += 5;
  }
  return score;
}

function pickBestEmail(candidates: string[]): string | null {
  if (candidates.length === 0) {
    return null;
  }
  const unique = [...new Set(candidates.map((e) => e.toLowerCase()))];
  unique.sort((a, b) => scoreEmail(b) - scoreEmail(a));
  return unique[0] ?? null;
}

function pickBestPhone(candidates: string[]): string | null {
  const unique = [...new Set(candidates.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return null;
  }
  unique.sort((a, b) => b.replace(/\D/g, "").length - a.replace(/\D/g, "").length);
  return unique[0] ?? null;
}

export function extractHeuristicContacts(pages: FetchedPage[]): HeuristicContacts {
  const emails: string[] = [];
  const phones: string[] = [];

  for (const page of pages) {
    emails.push(...extractMailtoEmails(page.html));
    phones.push(...extractTelPhones(page.html));

    const schema = extractSchemaContacts(page.html);
    emails.push(...schema.emails);
    phones.push(...schema.phones);

    const text = stripHtmlToText(page.html);
    emails.push(...extractRegexEmails(text));
    emails.push(...extractRegexEmails(deobfuscateText(page.html)));
  }

  const bestEmail = pickBestEmail(emails);
  const bestPhone = pickBestPhone(phones);

  return {
    emails: bestEmail ? [bestEmail] : [],
    phones: bestPhone ? [bestPhone] : [],
  };
}

export function pickHeuristicEmail(contacts: HeuristicContacts): string | null {
  return pickBestEmail(contacts.emails);
}

export function pickHeuristicPhone(contacts: HeuristicContacts): string | null {
  return pickBestPhone(contacts.phones);
}
