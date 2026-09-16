from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import joblib
import pandas as pd
import shap

app = FastAPI(title="Credit Risk Scoring API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("saved_models/credit_risk_model.pkl")
feature_names = joblib.load("saved_models/model_features.pkl")
feature_medians = joblib.load("saved_models/feature_medians.pkl")
explainer = shap.TreeExplainer(model)

RISK_THRESHOLD = 0.5

# Fields the UI sends as 0-1 scores — validated
BOUNDED_FIELDS = ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]
# Fields that must not be negative
NON_NEGATIVE = ["AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY",
                "AMT_GOODS_PRICE", "CNT_CHILDREN", "CNT_FAM_MEMBERS"]


class ApplicantData(BaseModel):
    features: dict


class BatchData(BaseModel):
    applicants: List[dict]


def validate(features: dict):
    for f in BOUNDED_FIELDS:
        if f in features and not (0.0 <= features[f] <= 1.0):
            raise HTTPException(422, f"{f} must be between 0 and 1. Got {features[f]}.")
    for f in NON_NEGATIVE:
        if f in features and features[f] < 0:
            raise HTTPException(422, f"{f} cannot be negative. Got {features[f]}.")


def build_row(features: dict) -> pd.DataFrame:
    """Turn a partial feature dict into a full model-ready row."""
    row = {col: feature_medians.get(col, 0) for col in feature_names}
    for k, v in features.items():
        if k in row:
            row[k] = v
    return pd.DataFrame([row])[feature_names]


def score(features: dict, n_reasons: int = 3):
    df = build_row(features)
    probability = float(model.predict_proba(df)[0][1])
    decision = "Reject" if probability >= RISK_THRESHOLD else "Approve"

    shap_values = explainer.shap_values(df)
    contributions = list(zip(feature_names, shap_values[0]))
    contributions.sort(key=lambda x: abs(x[1]), reverse=True)
    reasons = [
        {"feature": name, "impact": round(float(val), 4)}
        for name, val in contributions[:n_reasons]
    ]
    return probability, decision, reasons


@app.get("/")
def root():
    return {"message": "Credit Risk Scoring API is running", "version": "2.0"}


@app.get("/features")
def list_features():
    """What the model expects — useful for the frontend and for debugging."""
    return {"count": len(feature_names), "features": feature_names}


@app.post("/predict")
def predict(applicant: ApplicantData):
    validate(applicant.features)
    probability, decision, reasons = score(applicant.features, n_reasons=3)
    return {
        "default_probability": round(probability, 4),
        "decision": decision,
        "top_reasons": reasons,
    }


@app.post("/explain")
def explain(applicant: ApplicantData):
    """Fuller breakdown — top 10 factors, split into risk-increasing and risk-reducing."""
    validate(applicant.features)
    probability, decision, reasons = score(applicant.features, n_reasons=10)
    return {
        "default_probability": round(probability, 4),
        "decision": decision,
        "base_value": round(float(explainer.expected_value), 4),
        "increases_risk": [r for r in reasons if r["impact"] > 0],
        "reduces_risk": [r for r in reasons if r["impact"] < 0],
    }


@app.post("/batch")
def batch(data: BatchData):
    """Score several applicants at once."""
    if len(data.applicants) > 100:
        raise HTTPException(422, "Maximum 100 applicants per batch.")
    results = []
    for i, features in enumerate(data.applicants):
        validate(features)
        probability, decision, reasons = score(features, n_reasons=3)
        results.append({
            "index": i,
            "default_probability": round(probability, 4),
            "decision": decision,
            "top_reasons": reasons,
        })
    approved = sum(1 for r in results if r["decision"] == "Approve")
    return {
        "count": len(results),
        "approved": approved,
        "rejected": len(results) - approved,
        "results": results,
    }