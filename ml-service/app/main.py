from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import numpy as np
import pandas as pd

from app.features import extract_features, prepare_features_df
from app.model import load_model_and_metrics

app = FastAPI(
    title="RecoverAI ML Service",
    description="Actual ML Engine for predicting transaction recovery and revenue risk",
    version="1.0.0"
)

# Load model and metrics on startup
model, evaluation_metrics = load_model_and_metrics()

# Input Validation Models
class TransactionInput(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in INR")
    paymentMethod: str = Field(default="card", description="Payment channel (card, upi, netbanking, wallet, emi)")
    bank: str = Field(default="Unknown Bank", description="Acquiring/Issuing Bank")

class CustomerHistoryInput(BaseModel):
    ltv: float = Field(default=0.0, ge=0, description="Customer Lifetime Value")
    failuresCount: int = Field(default=0, ge=0, description="Total previous failed payments")
    successesCount: int = Field(default=0, ge=0, description="Total previous captured payments")
    recoveredCount: int = Field(default=0, ge=0, description="Total previous failures recovered successfully")
    hoursSinceLastFailure: float = Field(default=720.0, ge=0, description="Hours since last transaction failure")

class PredictionRequest(BaseModel):
    transaction: TransactionInput
    history: CustomerHistoryInput

class PredictionResponse(BaseModel):
    recovery_probability: float
    risk_score: float
    expected_recovery: float
    recovery_priority: str

class BatchPredictionRequest(BaseModel):
    requests: List[PredictionRequest]

# Single Prediction Endpoint
@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    try:
        tx_dict = request.transaction.model_dump()
        hist_dict = request.history.model_dump()
        
        # 1. Feature Engineering
        feats = extract_features(tx_dict, hist_dict)
        feats_df = prepare_features_df([feats])
        
        # 2. ML Prediction
        prob = float(model.predict_proba(feats_df)[0][1])
        prob_rounded = round(prob, 4)
        
        # 3. Output metric calculations
        risk_score = (1.0 - prob_rounded) * 100.0
        expected_recovery = tx_dict['amount'] * prob_rounded
        
        # Priority mapping: High probability recoveries or high expected returns are High Priority
        if prob_rounded >= 0.70:
            priority = "HIGH"
        elif prob_rounded >= 0.45:
            priority = "MEDIUM"
        else:
            priority = "LOW"
            
        return PredictionResponse(
            recovery_probability=prob_rounded,
            risk_score=round(risk_score, 2),
            expected_recovery=round(expected_recovery, 2),
            recovery_priority=priority
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction Error: {str(e)}")

# Batch Prediction Endpoint
@app.post("/batch-predict", response_model=List[PredictionResponse])
def batch_predict(payload: BatchPredictionRequest):
    try:
        if not payload.requests:
            return []
            
        features_list = []
        amounts = []
        
        for req in payload.requests:
            tx_dict = req.transaction.model_dump()
            hist_dict = req.history.model_dump()
            features_list.append(extract_features(tx_dict, hist_dict))
            amounts.append(tx_dict['amount'])
            
        feats_df = prepare_features_df(features_list)
        probs = model.predict_proba(feats_df)[:, 1]
        
        responses = []
        for prob, amount in zip(probs, amounts):
            prob_val = float(prob)
            prob_rounded = round(prob_val, 4)
            risk_score = (1.0 - prob_rounded) * 100.0
            expected_recovery = amount * prob_rounded
            
            if prob_rounded >= 0.70:
                priority = "HIGH"
            elif prob_rounded >= 0.45:
                priority = "MEDIUM"
            else:
                priority = "LOW"
                
            responses.append(PredictionResponse(
                recovery_probability=prob_rounded,
                risk_score=round(risk_score, 2),
                expected_recovery=round(expected_recovery, 2),
                recovery_priority=priority
            ))
            
        return responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Batch Prediction Error: {str(e)}")

# Model Info Endpoint
@app.get("/model-info")
def get_model_info():
    return {
        "model_name": "RecoverAI ML Risk & Recovery Engine",
        "algorithm": "RandomForestClassifier",
        "version": "1.0.0",
        "status": "ONLINE",
        "features": [
            "amount", "ltv", "failures_count", "successes_count", "recovered_count",
            "hours_since_last_failure", "success_rate", "recovery_fraction",
            "payment_method_encoded", "is_high_value"
        ]
    }

# Model Evaluation Metrics Endpoint
@app.get("/evaluation")
def get_evaluation():
    if not evaluation_metrics:
        raise HTTPException(status_code=404, detail="Model evaluation metrics not found.")
    return evaluation_metrics
