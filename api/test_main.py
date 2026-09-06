"""
Comprehensive test suite for the Credit Risk Scoring API.
Tests are grouped by category: Unit, Integration, Boundary Value Analysis (BVA),
Equivalence Partitioning, Negative/Error handling, and Acceptance.
"""

import joblib
import pandas as pd
from fastapi.testclient import TestClient
from main import app, feature_names, feature_medians, RISK_THRESHOLD

client = TestClient(app)

# UNIT TESTS - test individual pieces of logic in isolation

def test_unit_medians_loaded():
    """The medians file should load one value per model feature."""
    assert len(feature_medians) == len(feature_names)


def test_unit_median_fill_logic():
    """Missing features should be replaceable by their median value."""
    # Simulate the fill logic directly, without the API
    input_df = pd.DataFrame([{"EXT_SOURCE_2": 0.5}])
    for col in feature_names:
        if col not in input_df.columns:
            input_df[col] = feature_medians.get(col, 0)
    # Every model feature should now be present
    assert all(col in input_df.columns for col in feature_names)


def test_unit_decision_threshold_logic():
    """Decision rule: >= threshold is Reject, below is Approve."""
    assert ("Reject" if 0.6 >= RISK_THRESHOLD else "Approve") == "Reject"
    assert ("Reject" if 0.4 >= RISK_THRESHOLD else "Approve") == "Approve"


# INTEGRATION TESTS - test the full request -> model -> response flow

def test_integration_health_check():
    """Root endpoint confirms the service is running."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_integration_predict_structure():
    """A prediction returns all expected fields with correct types."""
    response = client.post("/predict", json={"features": {"EXT_SOURCE_2": 0.5}})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["default_probability"], float)
    assert isinstance(data["decision"], str)
    assert isinstance(data["top_reasons"], list)


def test_integration_top_reasons_count_and_shape():
    """Exactly 3 reasons, each with a feature name and numeric impact."""
    response = client.post("/predict", json={"features": {"EXT_SOURCE_2": 0.4}})
    reasons = response.json()["top_reasons"]
    assert len(reasons) == 3
    for r in reasons:
        assert "feature" in r
        assert "impact" in r
        assert isinstance(r["impact"], float)


# BOUNDARY VALUE ANALYSIS (BVA) - test the edges of valid ranges

def test_bva_ext_source_lower_bound():
    """EXT_SOURCE at its minimum (0.0) should be accepted and valid."""
    response = client.post("/predict", json={
        "features": {"EXT_SOURCE_1": 0.0, "EXT_SOURCE_2": 0.0, "EXT_SOURCE_3": 0.0}
    })
    assert response.status_code == 200
    assert 0.0 <= response.json()["default_probability"] <= 1.0


def test_bva_ext_source_upper_bound():
    """EXT_SOURCE at its maximum (1.0) should be accepted and valid."""
    response = client.post("/predict", json={
        "features": {"EXT_SOURCE_1": 1.0, "EXT_SOURCE_2": 1.0, "EXT_SOURCE_3": 1.0}
    })
    assert response.status_code == 200
    assert 0.0 <= response.json()["default_probability"] <= 1.0


def test_bva_probability_never_exceeds_bounds():
    """Probability output must always stay within [0, 1], even at extremes."""
    response = client.post("/predict", json={
        "features": {"AMT_INCOME_TOTAL": 0, "AMT_CREDIT": 100000000}
    })
    prob = response.json()["default_probability"]
    assert 0.0 <= prob <= 1.0


def test_bva_zero_income():
    """Income at the boundary value of 0 should not crash the service."""
    response = client.post("/predict", json={"features": {"AMT_INCOME_TOTAL": 0}})
    assert response.status_code == 200


# EQUIVALENCE PARTITIONING - one representative per input class

def test_equiv_high_risk_class():
    """Representative of the HIGH-risk partition -> Reject."""
    response = client.post("/predict", json={
        "features": {"EXT_SOURCE_1": 0.05, "EXT_SOURCE_2": 0.05, "EXT_SOURCE_3": 0.05}
    })
    data = response.json()
    assert data["decision"] == "Reject"
    assert data["default_probability"] > 0.5


def test_equiv_low_risk_class():
    """Representative of the LOW-risk partition -> Approve."""
    response = client.post("/predict", json={
        "features": {"EXT_SOURCE_1": 0.85, "EXT_SOURCE_2": 0.85, "EXT_SOURCE_3": 0.85}
    })
    data = response.json()
    assert data["decision"] == "Approve"
    assert data["default_probability"] < 0.5


# NEGATIVE / ERROR TESTS - malformed or invalid input

def test_negative_missing_features_key():
    """A request missing the required 'features' key should be rejected (422)."""
    response = client.post("/predict", json={"wrong_key": {}})
    assert response.status_code == 422


def test_negative_features_wrong_type():
    """'features' as a string instead of an object should be rejected (422)."""
    response = client.post("/predict", json={"features": "not_a_dict"})
    assert response.status_code == 422


def test_negative_empty_body():
    """A completely empty request body should be rejected (422)."""
    response = client.post("/predict", json={})
    assert response.status_code == 422


# ACCEPTANCE TESTS - does it meet the real business requirement?

def test_acceptance_full_applicant_journey():
    """
    Business requirement: an underwriter submits a complete applicant and
    receives a decision plus explainable reasons in one response.
    """
    response = client.post("/predict", json={
        "features": {
            "AMT_INCOME_TOTAL": 180000,
            "AMT_CREDIT": 500000,
            "AMT_ANNUITY": 25000,
            "EXT_SOURCE_1": 0.55,
            "EXT_SOURCE_2": 0.60,
            "EXT_SOURCE_3": 0.50,
        }
    })
    assert response.status_code == 200
    data = response.json()
    # A usable decision is present
    assert data["decision"] in ("Approve", "Reject")
    # A probability is present and valid
    assert 0.0 <= data["default_probability"] <= 1.0
    # The decision is explainable (reasons provided)
    assert len(data["top_reasons"]) == 3

def test_negative_ext_source_out_of_range():
    """EXT_SOURCE values outside 0-1 are invalid and should be rejected (422)."""
    response = client.post("/predict", json={
        "features": {
            "EXT_SOURCE_1": 4,
            "EXT_SOURCE_2": 2,
            "EXT_SOURCE_3": 4
        }
    })
    assert response.status_code == 422