from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import shap

app = FastAPI(title="Credit Risk Scoring API")

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


class ApplicantData(BaseModel):
    features:dict


@app.get("/")
def root():
    return {"message": "Credit Risk Scoring API is running"}


@app.post("/predict")
def predict(applicant: ApplicantData):
    # Validate EXT_SOURCE values are within valid range
    ext_source_fields = ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]
    for field in ext_source_fields:
        if field in applicant.features:
            value = applicant.features[field]
            if not (0.0 <= value <= 1.0):
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} must be between 0 and 1. Got {value}."
                )

    input_df = pd.DataFrame([applicant.features])
    for col in feature_names:
        if col not in input_df.columns:
            input_df[col] = feature_medians.get(col, 0)

    input_df = input_df.reindex(columns=feature_names)
    probability = model.predict_proba(input_df)[0][1]
    decision = "Reject" if probability >= RISK_THRESHOLD else "Approve"

    shap_values = explainer.shap_values(input_df)
    contributions = list(zip(feature_names, shap_values[0]))
    contributions.sort(key=lambda x: abs(x[1]), reverse=True)
    top_reasons = [
        {"feature": name, "impact": round(float(value), 4)}
        for name, value in contributions[:3]
    ]

    return {
        "default_probability": round(float(probability), 4),
        "decision": decision,
        "top_reasons": top_reasons
    }