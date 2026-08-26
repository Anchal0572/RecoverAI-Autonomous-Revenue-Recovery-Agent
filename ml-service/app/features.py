import pandas as pd
import numpy as np

def extract_features(tx_data: dict, history_data: dict) -> dict:
    """
    Extracts features for ML model input from a transaction and its customer history.
    """
    amount = tx_data.get('amount', 0.0)
    payment_method = tx_data.get('paymentMethod', 'card').lower()
    
    # Customer history attributes
    ltv = history_data.get('ltv', 0.0)
    failures_count = history_data.get('failuresCount', 0)
    successes_count = history_data.get('successesCount', 0)
    recovered_count = history_data.get('recoveredCount', 0)
    hours_since_last_failure = history_data.get('hoursSinceLastFailure', 720.0) # default to 30 days if no history
    
    # Feature calculations
    total_tx_count = successes_count + failures_count
    success_rate = successes_count / total_tx_count if total_tx_count > 0 else 1.0
    recovery_fraction = recovered_count / failures_count if failures_count > 0 else 0.0
    
    # Categorical mappings
    payment_method_val = {
        'card': 0,
        'upi': 1,
        'netbanking': 2,
        'wallet': 3,
        'emi': 4
    }.get(payment_method, 0)
    
    features = {
        'amount': float(amount),
        'ltv': float(ltv),
        'failures_count': int(failures_count),
        'successes_count': int(successes_count),
        'recovered_count': int(recovered_count),
        'hours_since_last_failure': float(hours_since_last_failure),
        'success_rate': float(success_rate),
        'recovery_fraction': float(recovery_fraction),
        'payment_method_encoded': payment_method_val,
        'is_high_value': 1 if amount >= 50000 else 0
    }
    return features

def prepare_features_df(features_list: list) -> pd.DataFrame:
    """
    Converts a list of features dictionaries to a Pandas DataFrame ready for prediction.
    """
    df = pd.DataFrame(features_list)
    
    # Ensure all expected columns are present
    expected_cols = [
        'amount', 'ltv', 'failures_count', 'successes_count', 'recovered_count',
        'hours_since_last_failure', 'success_rate', 'recovery_fraction',
        'payment_method_encoded', 'is_high_value'
    ]
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0.0
            
    # Order columns consistently
    return df[expected_cols]
