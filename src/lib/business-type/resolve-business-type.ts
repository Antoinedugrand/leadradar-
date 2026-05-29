import { placeTypeLabel } from "@/lib/i18n";
import type { TFunction } from "@/lib/i18n";
import type { Prospect } from "@/lib/types";

import { isGenericPlaceType } from "./generic-types";

export function needsBusinessTypeInference(prospect: Pick<Prospect, "type" | "business_type_label">): boolean {
  if (prospect.business_type_label?.trim()) {
    return false;
  }
  return isGenericPlaceType(prospect.type);
}

export function resolveBusinessTypeLabel(
  prospect: Pick<Prospect, "type" | "business_type_label">,
  t: TFunction,
): string | null {
  if (prospect.business_type_label?.trim()) {
    return prospect.business_type_label.trim();
  }
  if (prospect.type && !isGenericPlaceType(prospect.type)) {
    return placeTypeLabel(t, prospect.type);
  }
  return null;
}
