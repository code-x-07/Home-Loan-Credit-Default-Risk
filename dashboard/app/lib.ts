export interface Reason {
  feature: string;
  impact: number;
}

export interface PredictionResult {
  default_probability: number;
  decision: string;
  top_reasons: Reason[];
}

export interface ExplainResult {
  default_probability: number;
  decision: string;
  base_value: number;
  increases_risk: Reason[];
  reduces_risk: Reason[];
}

const API_BASE = "https://home-credit-api-vjya.onrender.com";

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const detail = err?.detail;
    if (typeof detail === "string") throw new Error(detail);
    throw new Error("Request failed. Please check your inputs.");
  }
  return response.json();
}

export async function getPrediction(features: Record<string, number>) {
  return post<PredictionResult>("/predict", { features });
}

export async function getExplanation(features: Record<string, number>) {
  return post<ExplainResult>("/explain", { features });
}