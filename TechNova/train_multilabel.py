import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import classification_report
import joblib

CSV_PATH = "data/air_with_labels.csv"
MODEL_OUT = "disease_model.pkl"

def load_and_prepare(csv_path):
    df = pd.read_csv(csv_path, parse_dates=["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    features = ["co2_ppm","co_ppm","pm2_5_ugm3","no2_ppb","temperature_c","humidity_pct","overall_aqi"]
    df["pm2_5_roll_3"] = df["pm2_5_ugm3"].rolling(window=3, min_periods=1).mean()
    df["no2_roll_3"] = df["no2_ppb"].rolling(window=3, min_periods=1).mean()
    df["pm2_5_lag1"] = df["pm2_5_ugm3"].shift(1).bfill()
    df["no2_lag1"] = df["no2_ppb"].shift(1).bfill()


    X_cols = features + ["pm2_5_roll_3","no2_roll_3","pm2_5_lag1","no2_lag1"]
    X = df[X_cols].bfill().values


    y_cols = ["asthma","copd","resp_inf","cardio","allergy"]
    y = df[y_cols].values

    return df, X, y, X_cols, y_cols

def train(X, y):
    base = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    model = MultiOutputClassifier(base, n_jobs=-1)
    model.fit(X, y)
    return model

def evaluate(model, X, y, y_cols):
    preds = model.predict(X)
    print("=== Classification report (training data) ===")
    for i, col in enumerate(y_cols):
        print(f"--- {col} ---")
        print(classification_report(y[:,i], preds[:,i], zero_division=0))

def main():
    df, X, y, X_cols, y_cols = load_and_prepare(CSV_PATH)
    model = train(X, y)
    evaluate(model, X, y, y_cols)

    # Save model
    joblib.dump({"model": model, "feature_cols": X_cols, "label_cols": y_cols}, MODEL_OUT)
    print("Model saved to", MODEL_OUT)

if __name__ == "__main__":
    main()
