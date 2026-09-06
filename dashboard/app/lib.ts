// Talks to the FastAPI backend running on port 8000

export interface Reason {
  feature: string;
  impact: number;
}

export interface PredictionResult {
  default_probability: number;
  decision: string;
  top_reasons: Reason[];
}

export async function getPrediction(
  features: Record<string, number>
): Promise<PredictionResult> {
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });

  if (!response.ok) {
    throw new Error("Prediction request failed");
  }

  return response.json();
}