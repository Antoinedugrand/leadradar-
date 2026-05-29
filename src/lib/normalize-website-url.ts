export function normalizeWebsiteUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    try {
      const parsed = new URL(`https://${value}`);
      return parsed.toString();
    } catch {
      return null;
    }
  }
}
