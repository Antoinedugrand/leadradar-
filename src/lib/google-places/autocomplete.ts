export interface PlaceAutocompletePrediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

export type PlaceAutocompleteStatus =
  | "OK"
  | "ZERO_RESULTS"
  | "INVALID_REQUEST"
  | "OVER_QUERY_LIMIT"
  | "REQUEST_DENIED"
  | "UNKNOWN_ERROR";

export interface PlaceAutocompleteOutcome {
  predictions: PlaceAutocompletePrediction[];
  status: PlaceAutocompleteStatus;
  errorMessage?: string;
}

interface GoogleAutocompleteResponse {
  predictions?: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
  status: PlaceAutocompleteStatus;
  error_message?: string;
}

export async function fetchPlaceAutocomplete(
  input: string,
  apiKey: string,
  options?: { language?: string },
): Promise<PlaceAutocompleteOutcome> {
  const params = new URLSearchParams({
    input: input.trim(),
    types: "(regions)",
    key: apiKey,
  });

  if (options?.language) {
    params.set("language", options.language);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
  );

  if (!response.ok) {
    return {
      predictions: [],
      status: "UNKNOWN_ERROR",
      errorMessage: `HTTP ${response.status}`,
    };
  }

  const data = (await response.json()) as GoogleAutocompleteResponse;
  const status = data.status ?? "UNKNOWN_ERROR";

  if (status !== "OK" && status !== "ZERO_RESULTS") {
    return {
      predictions: [],
      status,
      errorMessage: data.error_message,
    };
  }

  const predictions = (data.predictions ?? []).map((item) => ({
    placeId: item.place_id,
    description: item.description,
    mainText: item.structured_formatting?.main_text,
    secondaryText: item.structured_formatting?.secondary_text,
  }));

  return { predictions, status };
}
