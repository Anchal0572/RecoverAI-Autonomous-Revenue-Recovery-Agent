from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.features import extract_features

client = TestClient(app)

def test_feature_engineering():
    tx = {"amount": 10000.0, "paymentMethod": "upi", "bank": "HDFC"}
    history = {
        "ltv": 25000.0,
        "failuresCount": 2,
        "successesCount": 5,
        "recoveredCount": 1,
        "hoursSinceLastFailure": 36.0
    }
    feats = extract_features(tx, history)
    assert feats["amount"] == 10000.0
    assert feats["ltv"] == 25000.0
    assert feats["failures_count"] == 2
    assert feats["success_rate"] == 5 / 7
    assert feats["recovery_fraction"] == 0.5
    assert feats["payment_method_encoded"] == 1 # UPI maps to 1
    assert feats["is_high_value"] == 0

def test_single_prediction_valid():
    payload = {
        "transaction": {
            "amount": 2500.0,
            "paymentMethod": "card",
            "bank": "ICICI"
        },
        "history": {
            "ltv": 15000.0,
            "failuresCount": 1,
            "successesCount": 3,
            "recoveredCount": 1,
            "hoursSinceLastFailure": 48.0
        }
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "recovery_probability" in data
    assert "risk_score" in data
    assert "expected_recovery" in data
    assert "recovery_priority" in data
    assert 0.0 <= data["recovery_probability"] <= 1.0
    assert 0.0 <= data["risk_score"] <= 100.0
    assert data["expected_recovery"] == round(2500.0 * data["recovery_probability"], 2)
    assert data["recovery_priority"] in ["HIGH", "MEDIUM", "LOW"]

def test_predict_missing_fields():
    payload = {
        "transaction": {
            "paymentMethod": "card"
        },
        "history": {
            "ltv": 1000.0
        }
    }
    res = client.post("/predict", json=payload)
    # FastAPI returns 422 Unprocessable Entity for missing required Pydantic fields
    assert res.status_code == 422

def test_predict_invalid_values():
    payload = {
        "transaction": {
            "amount": -500.0, # Negative amount is invalid (gt=0 validation)
            "paymentMethod": "card"
        },
        "history": {
            "failuresCount": -1 # Negative count is invalid (ge=0 validation)
        }
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422

def test_batch_prediction():
    payload = {
        "requests": [
            {
                "transaction": {"amount": 1000.0, "paymentMethod": "card"},
                "history": {"ltv": 2000.0}
            },
            {
                "transaction": {"amount": 80000.0, "paymentMethod": "upi"},
                "history": {"ltv": 120000.0, "failuresCount": 2, "successesCount": 10, "recoveredCount": 2}
            }
        ]
    }
    res = client.post("/batch-predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert "recovery_probability" in data[0]
    assert "recovery_probability" in data[1]

def test_endpoints_info():
    res_info = client.get("/model-info")
    assert res_info.status_code == 200
    info = res_info.json()
    assert info["algorithm"] == "RandomForestClassifier"
    assert "features" in info
    
    res_eval = client.get("/evaluation")
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    assert "precision" in eval_data
    assert "recall" in eval_data
    assert "f1" in eval_data
    assert "roc_auc" in eval_data
    assert "confusion_matrix" in eval_data
    assert "roc_curve" in eval_data
