import type { FetchedPage } from "./types";
import {
  buildContactPageUrls,
  fetchPageHtmlWithBrowserHeaders,
  normalizeWebsiteUrl,
} from "@/lib/website-fetch/probe-website";

export { buildContactPageUrls, normalizeWebsiteUrl };

export async function fetchPageHtml(url: string): Promise<string | null> {
  return fetchPageHtmlWithBrowserHeaders(url);
}

export async function fetchWebsitePages(websiteUrl: string): Promise<FetchedPage[]> {
  const urls = buildContactPageUrls(websiteUrl);
  const pages: FetchedPage[] = [];

  for (const url of urls) {
    const html = await fetchPageHtml(url);
    if (html) {
      pages.push({ url, html });
    }
  }

  return pages;
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function combinePagesText(pages: FetchedPage[], maxChars = 8000): string {
  const combined = pages.map((page) => stripHtmlToText(page.html)).join("\n\n");
  return combined.slice(0, maxChars);
}
