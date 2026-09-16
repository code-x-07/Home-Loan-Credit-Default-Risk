"use client";

import { useState } from "react";
import { getExplanation, ExplainResult } from "./lib";
import { FINANCIAL, SCORES, PERSONAL, CATEGORICAL, NumField } from "./fields";

const ALL_NUM = [...FINANCIAL, ...SCORES, ...PERSONAL];

function initialNums(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of ALL_NUM) out[f.key] = f.default;
  return out;
}

function initialCats(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of CATEGORICAL) out[f.key] = 0;
  return out;
}

function prettyName(raw: string) {
  const map: Record<string, string> = {
    EXT_SOURCE_1: "Bureau A score",
    EXT_SOURCE_2: "Bureau B score",
    EXT_SOURCE_3: "Bureau C score",
    AMT_INCOME_TOTAL: "Annual income",
    AMT_CREDIT: "Loan amount",
    AMT_ANNUITY: "Annual repayment",
    AMT_GOODS_PRICE: "Property value",
    DAYS_BIRTH: "Age",
    DAYS_EMPLOYED: "Employment length",
    CNT_CHILDREN: "Children",
    CNT_FAM_MEMBERS: "Family size",
  };
  if (map[raw]) return map[raw];
  return raw
    .replace(/^NAME_/, "")
    .replace(/^FLAG_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

export default function Home() {
  const [nums, setNums] = useState<Record<string, number>>(initialNums);
  const [cats, setCats] = useState<Record<string, number>>(initialCats);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildFeatures(): Record<string, number> {
    const f: Record<string, number> = {};

    for (const field of FINANCIAL) f[field.key] = nums[field.key];
    for (const field of SCORES) f[field.key] = nums[field.key];

    f["CNT_CHILDREN"] = nums["CNT_CHILDREN"];
    f["CNT_FAM_MEMBERS"] = nums["CNT_FAM_MEMBERS"];
    f["DAYS_BIRTH"] = -Math.round(nums["AGE_YEARS"] * 365);
    f["DAYS_EMPLOYED"] = -Math.round(nums["EMPLOYED_YEARS"] * 365);

    for (const field of CATEGORICAL) {
      const chosen = field.options[cats[field.key]];
      Object.assign(f, chosen.columns);
    }
    return f;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await getExplanation(buildFeatures()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the scoring service.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setNums(initialNums());
    setCats(initialCats());
    setResult(null);
    setError(null);
  }

  const riskPct = result ? Math.round(result.default_probability * 100) : 0;
  const isReject = result?.decision === "Reject";
  const accent = isReject ? "#A23E3E" : "#3E7A5C";

  function numInput(field: NumField) {
    const v = nums[field.key];
    return (
      <div key={field.key} className="mb-4">
        <div className="flex justify-between items-baseline mb-1">
          <label className="text-sm">{field.label}</label>
          <span className="text-sm tabular-nums text-[#1C1E22]/70">
            {field.prefix ?? ""}
            {v.toLocaleString()}
            {field.suffix ? ` ${field.suffix}` : ""}
          </span>
        </div>
        {field.hint && (
          <p className="text-xs text-[#1C1E22]/40 mb-1.5">{field.hint}</p>
        )}
        {field.slider ? (
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={v}
            onChange={(e) => setNums({ ...nums, [field.key]: Number(e.target.value) })}
            className="w-full accent-[#1C1E22]"
          />
        ) : (
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={v}
            onChange={(e) => setNums({ ...nums, [field.key]: Number(e.target.value) })}
            className="w-full border border-[#1C1E22]/20 bg-white px-3 py-2 text-sm tabular-nums focus:border-[#1C1E22] focus:outline-none"
          />
        )}
      </div>
    );
  }

  function reasonRow(r: { feature: string; impact: number }) {
    const up = r.impact > 0;
    const width = Math.min(Math.abs(r.impact) * 120, 100);
    return (
      <div key={r.feature} className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>{prettyName(r.feature)}</span>
          <span className="tabular-nums" style={{ color: up ? "#A23E3E" : "#3E7A5C" }}>
            {up ? "+" : ""}
            {r.impact}
          </span>
        </div>
        <div className="h-1.5 bg-[#1C1E22]/10">
          <div
            className="h-full"
            style={{ width: `${width}%`, backgroundColor: up ? "#A23E3E" : "#3E7A5C" }}
          />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F5F1] text-[#1C1E22] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-[#1C1E22]/15 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Credit Risk Console</h1>
            <p className="mt-1 text-sm text-[#1C1E22]/60">
              Enter an applicant&apos;s details to assess default risk.
            </p>
          </div>
          <button
            onClick={reset}
            className="text-sm text-[#1C1E22]/50 hover:text-[#1C1E22] underline"
          >
            Reset
          </button>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <section>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#1C1E22]/50">
                  Loan details
                </h2>
                {FINANCIAL.map(numInput)}

                <h2 className="mb-4 mt-8 text-xs font-medium uppercase tracking-wider text-[#1C1E22]/50">
                  External credit scores
                </h2>
                {SCORES.map(numInput)}
              </div>

              <div>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#1C1E22]/50">
                  Applicant
                </h2>
                {PERSONAL.map(numInput)}

                <h2 className="mb-4 mt-8 text-xs font-medium uppercase tracking-wider text-[#1C1E22]/50">
                  Background
                </h2>
                {CATEGORICAL.map((field) => (
                  <div key={field.key} className="mb-4">
                    <label className="block text-sm mb-1">{field.label}</label>
                    <select
                      value={cats[field.key]}
                      onChange={(e) => setCats({ ...cats, [field.key]: Number(e.target.value) })}
                      className="w-full border border-[#1C1E22]/20 bg-white px-3 py-2 text-sm focus:border-[#1C1E22] focus:outline-none"
                    >
                      {field.options.map((o, i) => (
                        <option key={o.label} value={i}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-8 w-full bg-[#1C1E22] py-3 text-sm font-medium text-[#F7F5F1] hover:bg-[#1C1E22]/90 disabled:opacity-50"
            >
              {loading ? "Assessing..." : "Assess risk"}
            </button>

            {error && (
              <div className="mt-4 border border-[#A23E3E]/30 bg-[#A23E3E]/5 px-4 py-3">
                <p className="text-sm font-medium text-[#A23E3E]">Error</p>
                <p className="mt-0.5 text-sm text-[#A23E3E]/80">{error}</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#1C1E22]/50">
              Assessment
            </h2>

            {!result ? (
              <div className="border border-dashed border-[#1C1E22]/20 p-10 text-center text-sm text-[#1C1E22]/40">
                No assessment yet.
              </div>
            ) : (
              <div className="border border-[#1C1E22]/15 bg-white">
                <div className="border-b border-[#1C1E22]/10 p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[#1C1E22]/60">Default probability</span>
                    <span className="text-4xl font-semibold tabular-nums">{riskPct}%</span>
                  </div>
                  <div className="mt-3 h-1.5 bg-[#1C1E22]/10">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${riskPct}%`, backgroundColor: accent }}
                    />
                  </div>
                  <div
                    className="mt-4 inline-block px-3 py-1 text-sm font-medium"
                    style={{ backgroundColor: accent, color: "#F7F5F1" }}
                  >
                    {result.decision}
                  </div>
                </div>

                {result.increases_risk.length > 0 && (
                  <div className="border-b border-[#1C1E22]/10 p-6">
                    <h3 className="mb-3 text-sm font-medium text-[#A23E3E]">Increases risk</h3>
                    {result.increases_risk.map(reasonRow)}
                  </div>
                )}

                {result.reduces_risk.length > 0 && (
                  <div className="p-6">
                    <h3 className="mb-3 text-sm font-medium text-[#3E7A5C]">Reduces risk</h3>
                    {result.reduces_risk.map(reasonRow)}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}