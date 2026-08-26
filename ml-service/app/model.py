import os
import pickle
import numpy as np
import pandas as pd
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score, confusion_matrix, roc_curve

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
EVAL_PATH = os.path.join(os.path.dirname(__file__), 'evaluation.json')

def generate_synthetic_data(n_samples=5000, seed=42):
    """
    Generates realistic historical transactions dataset for training recovery model.
    """
    np.random.seed(seed)
    
    amount = np.random.exponential(scale=15000, size=n_samples) + 250
    ltv = amount * np.random.uniform(1.2, 5.0, size=n_samples)
    failures_count = np.random.poisson(lam=1.5, size=n_samples)
    successes_count = np.random.poisson(lam=8.0, size=n_samples) + 1
    recovered_count = np.round(failures_count * np.random.uniform(0.1, 0.7, size=n_samples)).astype(int)
    
    # Ensure count integrity
    recovered_count = np.minimum(recovered_count, failures_count)
    
    hours_since_last_failure = np.random.exponential(scale=120, size=n_samples)
    
    total_tx = successes_count + failures_count
    success_rate = successes_count / total_tx
    recovery_fraction = np.where(failures_count > 0, recovered_count / failures_count, 0.5)
    
    payment_method = np.random.choice([0, 1, 2, 3, 4], size=n_samples)
    is_high_value = (amount >= 50000).astype(int)
    
    # Recovery probability calculation using realistic correlation features
    score = (
        0.4 * success_rate + 
        0.5 * recovery_fraction - 
        0.15 * (hours_since_last_failure / 240) - 
        0.2 * is_high_value + 
        0.3 * (payment_method == 1) # UPI has higher success
    )
    prob = 1 / (1 + np.exp(-score))
    y = (np.random.rand(n_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        'amount': amount,
        'ltv': ltv,
        'failures_count': failures_count,
        'successes_count': successes_count,
        'recovered_count': recovered_count,
        'hours_since_last_failure': hours_since_last_failure,
        'success_rate': success_rate,
        'recovery_fraction': recovery_fraction,
        'payment_method_encoded': payment_method,
        'is_high_value': is_high_value
    })
    return df, y

def train_and_evaluate():
    print("🤖 Training baseline recovery model...")
    X, y = generate_synthetic_data()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)
    
    importances = model.feature_importances_
    features = list(X.columns)
    feature_importances = sorted(
        [{"feature": f, "importance": float(i)} for f, i in zip(features, importances)],
        key=lambda x: x["importance"],
        reverse=True
    )
    
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_points = []
    step = max(1, len(fpr) // 50)
    for idx in range(0, len(fpr), step):
        roc_points.append({"fpr": float(fpr[idx]), "tpr": float(tpr[idx])})
    roc_points.append({"fpr": 1.0, "tpr": 1.0})
    
    eval_metrics = {
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "confusion_matrix": {
            "tn": int(cm[0][0]),
            "fp": int(cm[0][1]),
            "fn": int(cm[1][0]),
            "tp": int(cm[1][1])
        },
        "feature_importances": feature_importances,
        "roc_curve": roc_points
    }
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    with open(EVAL_PATH, 'w') as f:
        json.dump(eval_metrics, f, indent=2)
        
    print("✅ Model trained and metrics saved successfully!")
    return model, eval_metrics

def load_model_and_metrics():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(EVAL_PATH):
        return train_and_evaluate()
        
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
        
    with open(EVAL_PATH, 'r') as f:
        metrics = json.load(f)
        
    return model, metrics
