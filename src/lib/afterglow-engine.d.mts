export type WeatherScore = {
  score: number;
  beauty: {
    score: number;
    dimensions: { name: string; value: number | null; weight: number }[];
    notes: string[];
  } | null;
  confidence: string;
  confidence_note: string;
  members: {
    id: string;
    name: string;
    score: number | null;
    beauty: number | null;
    requestedWeight: number;
    effectiveWeight: number;
    error: string | null;
  }[];
  spread: number | null;
  warnings: string[];
  fetched_at: string;
  version: string;
  unavailable?: string;
};
declare const engine: {
  forecast(
    options: {
      lat: number;
      lon: number;
      date: string;
      offset: number;
      bearing: number | null;
      provider: string;
      model?: string;
      weights: Record<string, number>;
      astronomy?: { sunset: string; azimuth: number };
    },
    signal?: AbortSignal,
  ): Promise<WeatherScore>;
};
export default engine;
