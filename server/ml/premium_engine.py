"""
KleinGuard Premium Engine — Flask ML Microservice
Handles premium calculation (RandomForestRegressor) and fraud scoring (IsolationForest)
"""
import os
import json
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ========================================
#   Zone Risk Data
# ========================================
ZONE_FLOOD_PROB = {
    'Adyar': 0.72, 'Velachery': 0.68, 'T. Nagar': 0.45,
    'Anna Nagar': 0.38, 'Tambaram': 0.81, 'Perambur': 0.52,
    'Royapettah': 0.42, 'Nungambakkam': 0.35, 'Mylapore': 0.55,
    'Kodambakkam': 0.40,
}

ZONE_AVG_AQI = {
    'Adyar': 120, 'Velachery': 145, 'T. Nagar': 160,
    'Anna Nagar': 110, 'Tambaram': 135, 'Perambur': 175,
    'Royapettah': 155, 'Nungambakkam': 105, 'Mylapore': 125,
    'Kodambakkam': 140,
}

CITY_ZONES = {
    'Chennai': list(ZONE_FLOOD_PROB.keys()),
    'Mumbai': ['Andheri', 'Bandra', 'Dadar', 'Kurla', 'Thane', 'Borivali', 'Malad', 'Goregaon'],
    'Delhi': ['Dwarka', 'Rohini', 'Saket', 'Janakpuri', 'Pitampura', 'Lajpat Nagar'],
    'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'BTM Layout'],
    'Hyderabad': ['Madhapur', 'Gachibowli', 'Banjara Hills', 'Kukatpally', 'Secunderabad'],
    'Pune': ['Kothrud', 'Hinjewadi', 'Viman Nagar', 'Baner', 'Wakad', 'Hadapsar'],
}

# Try to load trained model, fall back to formula-based
premium_model = None
fraud_model = None

try:
    import joblib
    model_path = os.path.join(os.path.dirname(__file__), 'premium_model.pkl')
    if os.path.exists(model_path):
        premium_model = joblib.load(model_path)
        print('[ML] Premium model loaded from premium_model.pkl')
    
    fraud_path = os.path.join(os.path.dirname(__file__), 'fraud_model.pkl')
    if os.path.exists(fraud_path):
        fraud_model = joblib.load(fraud_path)
        print('[ML] Fraud model loaded from fraud_model.pkl')
except Exception as e:
    print(f'[ML] Could not load models: {e} — using formula fallback')


def calculate_premium_formula(data):
    """Deterministic premium calculation — used as fallback or primary if ML model unavailable"""
    zones = data.get('zones', ['Adyar'])
    city = data.get('city', 'Chennai')
    
    # Calculate average zone flood probability
    avg_flood_prob = np.mean([ZONE_FLOOD_PROB.get(z, 0.5) for z in zones])
    avg_aqi = np.mean([ZONE_AVG_AQI.get(z, 130) for z in zones])
    
    base_rate = 45
    zone_risk = round(0.5 + avg_flood_prob * 0.5, 2)
    aqi_exposure = round(0.7 + (data.get('aqi_avg', avg_aqi) / 1000), 2)
    demand_volatility = round(0.6 + (data.get('demand_drop_events', 1) * 0.07), 2)
    behavior_score = round(data.get('trust_score', 1.0) * 0.95, 2)
    claim_history = round(1.0 + (data.get('claim_count_4w', 0) * 0.08), 2)
    safety_compliance = 0.98
    
    coverage_amount = data.get('coverage_amount', 2000)
    coverage_factor = coverage_amount / 2000
    
    raw_premium = base_rate * zone_risk * aqi_exposure * demand_volatility * behavior_score * claim_history * safety_compliance * coverage_factor
    weekly_premium = max(15, round(raw_premium))
    
    risk_score = round(zone_risk * 0.4 + (aqi_exposure - 0.7) * 0.6 + demand_volatility * 0.15 + (1 - behavior_score) * 0.2, 2)
    risk_score = max(0.0, min(1.0, risk_score))
    
    risk_tier = 'low'
    if risk_score > 0.7:
        risk_tier = 'high'
    elif risk_score > 0.4:
        risk_tier = 'medium'
    
    # Generate a zone-specific recommendation
    high_risk_zones = [z for z in zones if ZONE_FLOOD_PROB.get(z, 0.5) > 0.6]
    if high_risk_zones:
        recommendation = f"Zone risk is moderate due to historical waterlogging in {high_risk_zones[0]} during Q4."
    else:
        recommendation = "Your zones have lower flood risk. Good behavioral score helps keep premium competitive."
    
    formula_parts = [f"₹{base_rate}"]
    formula_parts.append(f"{zone_risk}")
    formula_parts.append(f"{aqi_exposure}")
    formula_parts.append(f"{demand_volatility}")
    formula_parts.append(f"{behavior_score}")
    formula_parts.append(f"{claim_history}")
    formula_display = " × ".join(formula_parts) + f" = ₹{weekly_premium}/wk"
    
    return {
        'weekly_premium': weekly_premium,
        'coverage_amount': coverage_amount,
        'factors': {
            'base_rate': base_rate,
            'zone_risk': zone_risk,
            'aqi_exposure': aqi_exposure,
            'demand_volatility': demand_volatility,
            'behavior_score': behavior_score,
            'claim_history': claim_history,
            'safety_compliance': safety_compliance,
        },
        'risk_score': risk_score,
        'formula_display': formula_display,
        'risk_tier': risk_tier,
        'recommendation': recommendation,
    }


def calculate_premium_ml(data):
    """ML-based premium calculation using Random Forest"""
    if premium_model is None:
        return calculate_premium_formula(data)
    
    zones = data.get('zones', ['Adyar'])
    avg_flood_prob = np.mean([ZONE_FLOOD_PROB.get(z, 0.5) for z in zones])
    avg_aqi = np.mean([ZONE_AVG_AQI.get(z, 130) for z in zones])
    
    features = pd.DataFrame([{
        'flood_prob': avg_flood_prob,
        'aqi_avg': data.get('aqi_avg', avg_aqi),
        'demand_drop_events': data.get('demand_drop_events', 1),
        'trust_score': data.get('trust_score', 1.0),
        'claim_count_4w': data.get('claim_count_4w', 0),
        'hours_worked': data.get('hours_worked', 42),
        'coverage_factor': data.get('coverage_amount', 2000) / 2000,
    }])
    
    try:
        predicted_premium = max(15, round(premium_model.predict(features)[0]))
    except Exception:
        return calculate_premium_formula(data)
    
    # Still compute factors for display
    result = calculate_premium_formula(data)
    result['weekly_premium'] = predicted_premium
    result['formula_display'] = result['formula_display'].rsplit('=', 1)[0] + f"= ₹{predicted_premium}/wk"
    return result


@app.route('/calculate-premium', methods=['POST'])
def calc_premium():
    data = request.json
    result = calculate_premium_ml(data)
    return jsonify(result)


@app.route('/fraud-score', methods=['POST'])
def fraud_score():
    data = request.json
    
    # Feature extraction for fraud detection
    trust_score = data.get('trust_score', 1.0)
    hours_since_last_claim = data.get('hours_since_last_claim', 72)
    platform_active = 1 if data.get('platform_active', True) else 0
    location_valid = 1 if data.get('location_valid', True) else 0
    claim_count = data.get('claim_count_recent', 0)
    payout = data.get('payout_amount', 200)
    
    if fraud_model is not None:
        try:
            features = np.array([[trust_score, hours_since_last_claim, platform_active, location_valid, claim_count, payout / 1000]])
            anomaly_score = fraud_model.decision_function(features)[0]
            # Convert to 0-1 score (more negative = more anomalous)
            fraud_score_val = max(0.0, min(1.0, 0.5 - anomaly_score))
        except Exception:
            fraud_score_val = _formula_fraud_score(trust_score, hours_since_last_claim, platform_active, location_valid, claim_count)
    else:
        fraud_score_val = _formula_fraud_score(trust_score, hours_since_last_claim, platform_active, location_valid, claim_count)
    
    fraud_score_val = round(fraud_score_val, 3)
    
    flags = []
    if not platform_active:
        flags.append('Platform was not active during trigger')
    if not location_valid:
        flags.append('Location does not match trigger zone')
    if claim_count > 3:
        flags.append('High claim frequency in recent period')
    if trust_score < 0.7:
        flags.append('Low trust score')
    if hours_since_last_claim < 12:
        flags.append('Rapid successive claims')
    
    if fraud_score_val < 0.3:
        recommendation = 'auto_approve'
    elif fraud_score_val < 0.6:
        recommendation = 'review'
    else:
        recommendation = 'escalate'
    
    return jsonify({
        'fraud_score': fraud_score_val,
        'flags': flags,
        'recommendation': recommendation,
    })


def _formula_fraud_score(trust, hours_since, platform, location, claims):
    """Deterministic fraud scoring fallback"""
    score = 0.05  # Base score
    if not platform:
        score += 0.3
    if not location:
        score += 0.25
    if claims > 3:
        score += 0.15
    if trust < 0.7:
        score += 0.1
    if hours_since < 12:
        score += 0.1
    score *= (1.1 - trust)
    return max(0.0, min(1.0, score))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'premium_model': premium_model is not None,
        'fraud_model': fraud_model is not None,
    })


if __name__ == '__main__':
    print('\n  ╔══════════════════════════════════════╗')
    print('  ║   KleinGuard ML Premium Engine       ║')
    print('  ║   Port: 5001                         ║')
    print('  ╚══════════════════════════════════════╝\n')
    app.run(host='0.0.0.0', port=5001, debug=False)
