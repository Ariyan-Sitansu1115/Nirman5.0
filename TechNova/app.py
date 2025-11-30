from flask import Flask, request, jsonify
import joblib
import numpy as np
import shap
import firebase_admin
from firebase_admin import credentials, firestore
import os
import smtplib
from email.mime.text import MIMEText
import traceback

# -----------------------------
# Initialize Flask App
# -----------------------------
app = Flask(__name__)

# -----------------------------
# Load ML Model Bundle
# -----------------------------
bundle = joblib.load("disease_model.pkl")
model = bundle["model"]
FEATURE_COLS = bundle["feature_cols"]
LABEL_COLS = bundle["label_cols"]

print("✅ Loaded model with features:", FEATURE_COLS)
print("✅ Label columns:", LABEL_COLS)

# -----------------------------
# Firestore Initialization
# -----------------------------
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
print("✅ Connected to Firestore")

# -----------------------------
# Email alert configuration
# -----------------------------
EMAIL_SENDER = os.environ.get("ALERT_FROM_EMAIL")
EMAIL_PASSWORD = os.environ.get("ALERT_FROM_PASSWORD")
ALERT_TO_EMAIL = os.environ.get("ALERT_TO_EMAIL")  # your email for alerts


def send_alert_email(subject: str, body: str, to_email: str = None):
    """Send an email alert if credentials are configured."""
    sender = EMAIL_SENDER
    password = EMAIL_PASSWORD
    recipient = to_email or ALERT_TO_EMAIL
    if not (sender and password and recipient):
        print("ℹ️ Email not sent: missing ALERT_* env vars")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender, password)
            server.send_message(msg)
        print("✅ Alert email sent")
    except Exception as e:
        print("❌ Email send error:", e)


# -----------------------------
# Advice Templates
# -----------------------------
ADVICE_TEMPLATES = {
    "asthma": {
        "title": "Asthma exacerbation risk",
        "advice": [
            "Avoid outdoor strenuous exercise.",
            "Keep windows closed; increase indoor filtration if possible.",
            "Use prescribed inhaler as advised; consult physician if symptoms worsen.",
        ],
    },
    "copd": {
        "title": "COPD exacerbation risk",
        "advice": [
            "Avoid outdoor exposure; use face mask outdoors.",
            "Ensure medication adherence; seek medical advice for breathing difficulty.",
        ],
    },
    "resp_inf": {
        "title": "Respiratory infection risk",
        "advice": [
            "Reduce exposure to polluted air; maintain hydration and hygiene.",
            "If you have symptoms, consult a doctor.",
        ],
    },
    "cardio": {
        "title": "Cardiovascular risk",
        "advice": [
            "Avoid heavy exertion outdoors; those with heart disease should be cautious.",
            "Consult your cardiologist if you have chest pain or unusual breathlessness.",
        ],
    },
    "allergy": {
        "title": "Allergic reaction risk",
        "advice": [
            "Consider antihistamines if you have allergies; keep indoor air clean.",
            "Avoid outdoor activities during high pollutant episodes.",
        ],
    },
}

# -----------------------------
# SHAP Explanation Function
# -----------------------------
def explain_and_generate_advice(single_input_array):
    """
    Return names of the top 2 most important features for this prediction.
    Falls back to the first 2 features if SHAP fails.
    """
    try:
        explainer = shap.TreeExplainer(model.estimators_[0])
        shap_values = explainer.shap_values(single_input_array)
        top_idx = np.argsort(np.abs(shap_values).mean(axis=0))[-2:][::-1]
        top_features = [FEATURE_COLS[i] for i in top_idx]
    except Exception as e:
        print("ℹ️ SHAP explanation failed, using fallback features:", e)
        top_features = FEATURE_COLS[:2]
    return top_features


# -----------------------------
# Helper: Run Prediction Logic
# -----------------------------
def run_prediction(x):
    """
    x: numpy array of shape (1, n_features)
    Returns dict with predictions and metadata.
    """
    proba = model.predict_proba(x)
    preds = model.predict(x)[0]

    result = []

    for i, label in enumerate(LABEL_COLS):
        # For MultiOutputClassifier, proba is a list: one (n_samples, n_classes) per output
        p = None
        if isinstance(proba, (list, tuple)) and i < len(proba):
            try:
                p = float(proba[i][0][1])
            except Exception:
                p = None

        # Trigger if predicted 1 or probability high
        if preds[i] == 1 or (p is not None and p > 0.3):
            top_features = explain_and_generate_advice(x)
            advice = ADVICE_TEMPLATES.get(label, {}).get("advice", [])
            result.append(
                {
                    "label": label,
                    "predicted": int(preds[i]),
                    "probability": p,
                    "reason_features": top_features,
                    "advice": advice,
                }
            )

    return {"status": "ok", "predictions": result}


# -----------------------------
# Helper: Map ESP32 JSON -> FEATURE_COLS
# -----------------------------
def build_feature_values(payload: dict):
    """
    Build a dict {feature_name: float_value} for all FEATURE_COLS.
    Handles aliases so your ESP32 JSON keys can be like:
      temperature, humidity, co2_ppm, co_ppm, pm25, no2_ppm, aqi
    even if model feature names differ slightly.
    """
    feature_values = {}

    for col in FEATURE_COLS:
        col_lower = col.lower()
        # Default candidate keys: the feature name itself
        candidates = [col, col_lower]

        # Add common aliases based on name
        if "temp" in col_lower:
            candidates += ["temperature", "temp", "Temperature"]
        elif "humid" in col_lower:
            candidates += ["humidity", "hum", "Humidity"]
        elif "co2" in col_lower:
            candidates += ["co2_ppm", "co2", "CO2"]
        elif "co" in col_lower and "co2" not in col_lower:
            candidates += ["co_ppm", "co", "CO_ppm", "CO"]
        elif "pm" in col_lower:
            candidates += ["pm25", "pm_25", "PM2_5"]
        elif "no2" in col_lower:
            candidates += ["no2_ppm", "no2", "NO2"]
        elif "aqi" in col_lower:
            candidates += ["aqi", "AQI"]

        value = None
        for key in candidates:
            if key in payload:
                value = payload[key]
                break

        # Fallback: direct get
        if value is None:
            value = payload.get(col, 0.0)

        try:
            feature_values[col] = float(value)
        except Exception:
            feature_values[col] = 0.0

    print("🔹 Built feature_values from payload:", feature_values)
    return feature_values


# -----------------------------
# Route 1: Predict from Direct JSON (for testing)
# -----------------------------
@app.route("/api/v1/predict_disease", methods=["POST"])
def predict_disease():
    try:
        payload = request.get_json(force=True) or {}
        print("🔹 /predict_disease payload:", payload)

        feature_values = build_feature_values(payload)
        x = np.array([[feature_values[c] for c in FEATURE_COLS]], dtype=float)

        output = run_prediction(x)
        output["features"] = feature_values
        return jsonify(output)

    except Exception as e:
        print("❌ Error in /predict_disease:", e)
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# -----------------------------
# Route 2: Predict from Latest Firestore Data
# -----------------------------
@app.route("/api/v1/predict_from_cloud", methods=["GET"])
def predict_from_cloud():
    try:
        docs = (
            db.collection("sensorData")
            .order_by("__name__", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )
        latest_data = None
        for doc in docs:
            latest_data = doc.to_dict()

        if not latest_data:
            return (
                jsonify({"status": "error", "message": "No data found in Firestore."}),
                404,
            )

        print("🔹 Latest Firestore sensorData doc:", latest_data)

        feature_values = build_feature_values(latest_data)
        x = np.array([[feature_values[c] for c in FEATURE_COLS]], dtype=float)

        output = run_prediction(x)
        output["latest_data"] = latest_data
        output["features"] = feature_values
        return jsonify(output)
    except Exception as e:
        print("❌ Error in /predict_from_cloud:", e)
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# -----------------------------
# Route 3: ESP32 -> Backend (ML + Save Prediction + Email)
# -----------------------------
@app.route("/api/v1/ingest_from_device", methods=["POST"])
def ingest_from_device():
    """
    Called by ESP32.
    Expected JSON keys (can be any aliases, we map them):
        temperature, humidity, co2_ppm, co_ppm, pm25, no2_ppm, aqi
    Steps:
        1) Build feature vector
        2) Run ML model
        3) Store in 'DiseasePredictions'
        4) Send email alert if any risk predicted
    """
    try:
        payload = request.get_json(force=True) or {}
        print("🔹 /ingest_from_device raw payload:", payload)

        # 1) Build feature dict & feature vector
        feature_values = build_feature_values(payload)
        x = np.array([[feature_values[c] for c in FEATURE_COLS]], dtype=float)

        # 2) Run ML model
        prediction_output = run_prediction(x)
        predictions = prediction_output.get("predictions", [])
        print("✅ Predictions from model:", predictions)

        # 3) Store in Firestore
        doc_data = {
            "features": feature_values,
            "predictions": predictions,
            "created_at": firestore.SERVER_TIMESTAMP,
        }
        doc_ref = db.collection("DiseasePredictions").document()
        doc_ref.set(doc_data)
        print("✅ Stored prediction in DiseasePredictions:", doc_ref.id)

        # 4) Optional: send email alert if any risk predicted
        if predictions:
            lines = []
            for p in predictions:
                label = p.get("label", "unknown")
                prob = p.get("probability")
                prob_str = f"{prob:.2f}" if isinstance(prob, float) else "N/A"
                lines.append(f"- {label} (probability: {prob_str})")
            body = (
                "The air-quality ML model detected potential health risks:\n\n"
                + "\n".join(lines)
                + "\n\nFeatures:\n"
                + "\n".join(f"{k}: {v}" for k, v in feature_values.items())
            )
            send_alert_email("Air Quality Health Risk Alert", body)

        return jsonify(
            {
                "status": "ok",
                "document_id": doc_ref.id,
                "predictions": predictions,
                "features": feature_values,
            }
        ), 200

    except Exception as e:
        print("❌ Error in /ingest_from_device:", e)
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# -----------------------------
# Run Flask App
# -----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"🚀 Starting Flask on 0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
