"""
Train and save ML models for KleinGuard premium engine.
Run: python train_model.py
"""
import os
import numpy as np
import pandas as pd

ZONE_FLOOD_PROB = {
    'Adyar': 0.72, 'Velachery': 0.68, 'T. Nagar': 0.45,
    'Anna Nagar': 0.38, 'Tambaram': 0.81, 'Perambur': 0.52,
    'Royapettah': 0.42, 'Nungambakkam': 0.35, 'Mylapore': 0.55,
    'Kodambakkam': 0.40,
}

def generate_synthetic_data(n=500):
    """Generate synthetic training data for premium prediction"""
    np.random.seed(42)
    
    zones = list(ZONE_FLOOD_PROB.keys())
    rows = []
    
    for _ in range(n):
        # Randomly pick 1-3 zones
        n_zones = np.random.randint(1, 4)
        selected_zones = np.random.choice(zones, n_zones, replace=False)
        flood_prob = np.mean([ZONE_FLOOD_PROB[z] for z in selected_zones])
        
        aqi_avg = np.random.uniform(50, 450)
        demand_drop_events = np.random.randint(0, 6)
        trust_score = np.random.uniform(0.6, 1.0)
        claim_count_4w = np.random.randint(0, 5)
        hours_worked = np.random.uniform(20, 70)
        coverage_factor = np.random.uniform(0.5, 2.5)
        
        # Calculate target premium using formula + noise
        base = 45
        zone_risk = 0.5 + flood_prob * 0.5
        aqi_factor = 0.7 + (aqi_avg / 1000)
        demand_factor = 0.6 + (demand_drop_events * 0.07)
        behavior_factor = trust_score * 0.95
        claim_factor = 1.0 + (claim_count_4w * 0.08)
        
        premium = base * zone_risk * aqi_factor * demand_factor * behavior_factor * claim_factor * coverage_factor
        premium += np.random.normal(0, premium * 0.08)  # 8% Gaussian noise
        premium = max(15, premium)
        
        rows.append({
            'flood_prob': flood_prob,
            'aqi_avg': aqi_avg,
            'demand_drop_events': demand_drop_events,
            'trust_score': trust_score,
            'claim_count_4w': claim_count_4w,
            'hours_worked': hours_worked,
            'coverage_factor': coverage_factor,
            'premium': premium,
        })
    
    return pd.DataFrame(rows)


def train_premium_model():
    """Train RandomForest premium prediction model"""
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.model_selection import train_test_split
        import joblib
    except ImportError:
        print('[Train] scikit-learn not available — models will use formula fallback')
        return
    
    print('[Train] Generating 500 synthetic training samples...')
    df = generate_synthetic_data(500)
    
    features = ['flood_prob', 'aqi_avg', 'demand_drop_events', 'trust_score', 'claim_count_4w', 'hours_worked', 'coverage_factor']
    X = df[features]
    y = df['premium']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print('[Train] Training RandomForestRegressor...')
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f'[Train] R² — Train: {train_score:.4f}, Test: {test_score:.4f}')
    
    # Demonstrate zone differentiation
    print('\n[Train] Zone premium comparison (₹2000 coverage):')
    for zone, prob in sorted(ZONE_FLOOD_PROB.items(), key=lambda x: x[1], reverse=True):
        test_features = pd.DataFrame([{
            'flood_prob': prob,
            'aqi_avg': 150,
            'demand_drop_events': 1,
            'trust_score': 0.94,
            'claim_count_4w': 0,
            'hours_worked': 42,
            'coverage_factor': 1.0,
        }])
        premium = round(model.predict(test_features)[0])
        print(f'  {zone:15s} (flood: {prob:.2f}) → ₹{premium}/wk')
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'premium_model.pkl')
    joblib.dump(model, model_path)
    print(f'\n[Train] Premium model saved to {model_path}')
    return model


def train_fraud_model():
    """Train IsolationForest for fraud detection"""
    try:
        from sklearn.ensemble import IsolationForest
        import joblib
    except ImportError:
        print('[Train] scikit-learn not available — fraud model will use formula fallback')
        return
    
    np.random.seed(123)
    
    # Generate normal behavior patterns
    n = 300
    normal_data = np.column_stack([
        np.random.uniform(0.8, 1.0, n),        # trust_score
        np.random.uniform(24, 168, n),          # hours_since_last_claim
        np.ones(n),                              # platform_active
        np.ones(n),                              # location_valid
        np.random.randint(0, 3, n),             # claim_count_recent
        np.random.uniform(0.05, 0.6, n),        # payout / 1000
    ])
    
    print('[Train] Training IsolationForest for fraud detection...')
    model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
    model.fit(normal_data)
    
    model_path = os.path.join(os.path.dirname(__file__), 'fraud_model.pkl')
    joblib.dump(model, model_path)
    print(f'[Train] Fraud model saved to {model_path}')
    return model


if __name__ == '__main__':
    print('╔══════════════════════════════════════╗')
    print('║   KleinGuard ML Model Training       ║')
    print('╚══════════════════════════════════════╝\n')
    
    train_premium_model()
    print()
    train_fraud_model()
    print('\n[Train] All models trained successfully.')
