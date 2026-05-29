export function mergeBusinessTypeLabel(
  existing: { business_type_label?: string | null } | null | undefined,
  incoming: string | null | undefined,
): string | null {
  if (existing?.business_type_label?.trim()) {
    return existing.business_type_label.trim();
  }
  const trimmed = incoming?.trim();
  return trimmed || null;
}
