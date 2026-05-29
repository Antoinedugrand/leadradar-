const GENERIC_PLACE_TYPES = new Set([
  "establishment",
  "point_of_interest",
  "store",
  "food",
  "premise",
  "local_business",
  "place",
  "finance",
  "health",
  "general_contractor",
  "political",
  "geocode",
]);

export function isGenericPlaceType(type: string | null | undefined): boolean {
  if (!type) return true;
  return GENERIC_PLACE_TYPES.has(type.toLowerCase());
}

export function pickBestPlaceType(types: string[] | null | undefined): string | null {
  if (!types?.length) return null;
  const specific = types.find((type) => !isGenericPlaceType(type));
  return specific ?? types[0] ?? null;
}
