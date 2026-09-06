"use client";

import { useState } from "react";
import { getPrediction, PredictionResult } from "./lib";

const FIELDS = [
  {
    key: "AMT_INCOME_TOTAL",
    label: "Annual income",
    placeholder: "150000",
    min: 0,
    max: undefined,
    step: "1",
  },
  {
    key: "AMT_CREDIT",
    label: "Loan amount requested",
    placeholder: "500000",
    min: 0,
    max: undefined,
    step: "1",
  },
  {
    key: "AMT_ANNUITY",
    label: "Annual loan repayment",
    placeholder: "25000",
    min: 0,
    max: undefined,
    step: "1",
  },
  {
    key: "EXT_SOURCE_1",
    label: "External credit score 1 (0–1)",
    placeholder: "0.5",
    min: 0,
    max: 1,
    step: "0.01",
  },
  {
    key: "EXT_SOURCE_2",
    label: "External credit score 2 (0–1)",
    placeholder: "0.5",
    min: 0,
    max: 1,
    step: "0.01",
  },
  {
    key: "EXT_SOURCE_3",
    label: "External credit score 3 (0–1)",
    placeholder: "0.5",
    min: 0,
    max: 1,
    step: "0.01",
  },
];

export default function Home() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const features: Record<string, number> = {};
      for (const field of FIELDS) {
        const raw = values[field.key];
        if (raw !== undefined && raw !== "") {
          features[field.key] = Number(raw);
        }
      }
      const prediction = await getPrediction(features);
      setResult(prediction);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not reach the scoring service. Is the API running?");
      }
    } finally {
      setLoading(false);
    }
  }

  const riskPct = result ? Math.round(result.default_probability * 100) : 0;

  return (
    <main className="min-h-screen bg-[#F7F5F1] text-[#1C1E22] px-6 py-12">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-10 border-b border-[#1C1E22]/15 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Credit Risk Console
          </h1>
          <p className="mt-1 text-sm text-[#1C1E22]/60">
            Enter an applicant&apos;s details to assess default risk.
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-2">

          {/* Left: input form */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-[#1C1E22]/70">
              Applicant details
            </h2>
            <div className="space-y-4">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm mb-1">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ""}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(e) =>
                      setValues({ ...values, [field.key]: e.target.value })
                    }
                    className="w-full border border-[#1C1E22]/20 bg-white px-3 py-2 text-sm tabular-nums focus:border-[#1C1E22] focus:outline-none"
                  />
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-2 w-full bg-[#1C1E22] py-2.5 text-sm font-medium text-[#F7F5F1] hover:bg-[#1C1E22]/90 disabled:opacity-50"
              >
                {loading ? "Assessing..." : "Assess risk"}
              </button>

              {error && (
                <div className="border border-[#A23E3E]/30 bg-[#A23E3E]/5 px-4 py-3">
                  <p className="text-sm text-[#A23E3E] font-medium">
                    Error
                  </p>
                  <p className="text-sm text-[#A23E3E]/80 mt-0.5">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Right: result panel */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-[#1C1E22]/70">
              Assessment
            </h2>

            {!result ? (
              <div className="border border-dashed border-[#1C1E22]/20 p-8 text-center text-sm text-[#1C1E22]/40">
                No assessment yet. Enter details and run an assessment.
              </div>
            ) : (
              <div className="border border-[#1C1E22]/15 bg-white">

                {/* Score and decision */}
                <div className="border-b border-[#1C1E22]/10 p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[#1C1E22]/60">
                      Default probability
                    </span>
                    <span className="text-4xl font-semibold tabular-nums">
                      {riskPct}%
                    </span>
                  </div>

                  {/* Risk bar */}
                  <div className="mt-3 h-1.5 bg-[#1C1E22]/10">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${riskPct}%`,
                        backgroundColor:
                          result.decision === "Reject" ? "#A23E3E" : "#3E7A5C",
                      }}
                    />
                  </div>

                  {/* Decision badge */}
                  <div
                    className="mt-4 inline-block px-3 py-1 text-sm font-medium"
                    style={{
                      backgroundColor:
                        result.decision === "Reject" ? "#A23E3E" : "#3E7A5C",
                      color: "#F7F5F1",
                    }}
                  >
                    {result.decision}
                  </div>
                </div>

                {/* Top factors */}
                <div className="p-6">
                  <h3 className="mb-3 text-sm font-medium text-[#1C1E22]/70">
                    Top factors
                  </h3>
                  <div className="space-y-4">
                    {result.top_reasons.map((reason) => (
                      <div key={reason.feature}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{reason.feature}</span>
                          <span
                            className="tabular-nums"
                            style={{
                              color:
                                reason.impact > 0 ? "#A23E3E" : "#3E7A5C",
                            }}
                          >
                            {reason.impact > 0 ? "+" : ""}
                            {reason.impact}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#1C1E22]/10">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(
                                Math.abs(reason.impact) * 100,
                                100
                              )}%`,
                              backgroundColor:
                                reason.impact > 0 ? "#A23E3E" : "#3E7A5C",
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-[#1C1E22]/40">
                          {reason.impact > 0
                            ? "Increases risk"
                            : "Reduces risk"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}