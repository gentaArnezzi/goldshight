"""
infer.py — GoldSight daily inference pipeline.

Pulls Yahoo Finance data, retrains XGBoost and LSTM with stored hyperparameters,
generates predictions for 2026 trading days, and writes oos_2026.json.

Usage:
    python ml-pipeline/infer.py
"""

import json
import os
import sys
import warnings
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # Suppress TF warnings

# Add ml-pipeline to path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

from preprocessing import (
    pull_yahoo_data,
    compute_features,
    compute_target,
    add_xgb_lags,
    add_lstm_sequences,
    get_no_g3_xgb_feature_cols,
    get_no_g3_lstm_feature_cols,
    NO_G3_BASES,
    LSTM_WINDOW,
    HORIZON,
)

# ── Paths ───────────────────────────────────────────────────────────────────

XGB_SUMMARY = PROJECT_ROOT / "Jupyter Notebooks" / "Outputs" / "xgboost_5d" / "xgboost_summary_5d.json"
LSTM_SUMMARY = PROJECT_ROOT / "Jupyter Notebooks" / "Outputs" / "lstm_5d" / "lstm_summary_5d.json"
OUTPUT_PATH = PROJECT_ROOT / "web" / "src" / "data" / "oos_2026.json"

# ── Constants ───────────────────────────────────────────────────────────────

TRAIN_VAL_END = "2023-12-31"  # Train+val cutoff (same as thesis)
OOS_START = "2026-01-01"      # Out-of-sample period
TARGET_SCALE_XGB = 100.0      # XGBoost trains on scaled target (×100)
RANDOM_STATE = 42


def load_xgb_params() -> dict:
    """Load best XGBoost hyperparameters from summary JSON."""
    with open(XGB_SUMMARY) as f:
        summary = json.load(f)
    return summary["best_params"]


def load_lstm_config() -> dict:
    """Load best LSTM configuration from summary JSON."""
    with open(LSTM_SUMMARY) as f:
        summary = json.load(f)
    return summary


def set_global_seed(seed: int = RANDOM_STATE):
    """Set random seeds for reproducibility."""
    import random
    random.seed(seed)
    np.random.seed(seed)
    try:
        import tensorflow as tf
        tf.random.set_seed(seed)
    except ImportError:
        pass


def train_xgboost(train_df: pd.DataFrame, feature_cols: list[str], params: dict):
    """
    Train XGBoost on train+val data with best hyperparameters.
    Returns the fitted model.
    """
    X_train = train_df[feature_cols].copy()
    y_train = train_df["TARGET_5D"].copy() * TARGET_SCALE_XGB

    model = XGBRegressor(
        objective="reg:squarederror",
        eval_metric="mae",
        random_state=RANDOM_STATE,
        **params,
    )
    model.fit(X_train, y_train, verbose=False)
    return model


def predict_xgboost(model, eval_df: pd.DataFrame, feature_cols: list[str]) -> np.ndarray:
    """Run XGBoost prediction, unscale output."""
    X = eval_df[feature_cols].values
    preds_scaled = model.predict(X)
    return preds_scaled / TARGET_SCALE_XGB


def train_and_predict_lstm(
    train_df: pd.DataFrame,
    eval_df: pd.DataFrame,
    feature_cols: list[str],
    n_base_features: int,
    config: dict,
) -> np.ndarray:
    """
    Train LSTM on train+val data with best config, predict on eval data.
    Returns predictions in original scale.
    """
    import tensorflow as tf
    from tensorflow.keras import Sequential
    from tensorflow.keras.layers import Input, LSTM, Dense, Dropout

    set_global_seed(RANDOM_STATE)

    # Prepare data
    X_train_flat = train_df[feature_cols].values
    X_eval_flat = eval_df[feature_cols].values
    y_train = train_df[["TARGET_5D"]].values

    # Scale
    x_scaler = StandardScaler()
    y_scaler = StandardScaler()

    X_train_scaled = x_scaler.fit_transform(X_train_flat)
    X_eval_scaled = x_scaler.transform(X_eval_flat)
    y_train_scaled = y_scaler.fit_transform(y_train).ravel()

    # Reshape for LSTM: (samples, timesteps, features)
    X_train_3d = X_train_scaled.reshape(len(train_df), LSTM_WINDOW, n_base_features)
    X_eval_3d = X_eval_scaled.reshape(len(eval_df), LSTM_WINDOW, n_base_features)

    # Build model (MEDIUM architecture from thesis)
    tf.keras.backend.clear_session()
    model = Sequential()
    model.add(Input(shape=(LSTM_WINDOW, n_base_features)))

    architecture = config.get("best_config", {}).get("architecture", "MEDIUM")
    learning_rate = config.get("best_config", {}).get("learning_rate", 0.001)

    if architecture == "SMALL":
        model.add(LSTM(32))
        model.add(Dropout(0.2))
    elif architecture == "MEDIUM":
        model.add(LSTM(64, return_sequences=True))
        model.add(Dropout(0.2))
        model.add(LSTM(32))
        model.add(Dropout(0.2))
    else:
        raise ValueError(f"Unknown architecture: {architecture}")

    model.add(Dense(1))

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.Huber(),
    )

    # Train
    best_epochs = config.get("best_epochs", 14)
    batch_size = config.get("batch_size", 16)

    model.fit(
        X_train_3d,
        y_train_scaled,
        epochs=best_epochs,
        batch_size=batch_size,
        shuffle=False,
        verbose=0,
    )

    # Predict
    pred_scaled = model.predict(X_eval_3d, verbose=0).ravel()
    pred_original = y_scaler.inverse_transform(pred_scaled.reshape(-1, 1)).ravel()

    return pred_original


def compute_aggregate_metrics(
    predictions: list[dict],
) -> dict:
    """Compute MAE, RMSE, DA for predictions that have actuals."""
    evaluated = [p for p in predictions if p["actual"] is not None]
    if not evaluated:
        return {"nObservations": 0, "xgboost": None, "lstm": None}

    n = len(evaluated)
    actuals = np.array([p["actual"] for p in evaluated])

    metrics = {"nObservations": n}
    for model_key in ["xgboost", "lstm"]:
        pred_key = f"pred{model_key.capitalize()}"
        preds = np.array([p[pred_key] for p in evaluated])
        errors = actuals - preds

        mae = float(np.mean(np.abs(errors)))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        da = float(np.mean((actuals >= 0) == (preds >= 0)))

        metrics[model_key] = {"mae": mae, "rmse": rmse, "da": da}

    return metrics


def main():
    print("=" * 60)
    print("GoldSight Daily Pipeline")
    print(f"Run time: {datetime.utcnow().isoformat()}Z")
    print("=" * 60)

    # ── Step 1: Pull data ───────────────────────────────────────
    print("\n[1/6] Pulling Yahoo Finance data...")
    raw_df = pull_yahoo_data(start="2010-01-01")

    # ── Step 2: Feature engineering ─────────────────────────────
    print("\n[2/6] Computing features...")
    feat_df = compute_features(raw_df)
    target_df = compute_target(feat_df, horizon=HORIZON)

    print(f"  Total observations: {len(target_df)}")
    print(f"  Date range: {target_df['DATE'].min().date()} to {target_df['DATE'].max().date()}")

    # ── Step 3: Split data ──────────────────────────────────────
    print("\n[3/6] Splitting data...")
    train_val_mask = target_df["DATE"] <= TRAIN_VAL_END
    oos_mask = target_df["DATE"] >= OOS_START

    # Prepare XGBoost features
    xgb_df = add_xgb_lags(target_df)
    xgb_feature_cols = get_no_g3_xgb_feature_cols()
    xgb_train = xgb_df[xgb_df["DATE"] <= TRAIN_VAL_END].reset_index(drop=True)
    xgb_oos = xgb_df[xgb_df["DATE"] >= OOS_START].reset_index(drop=True)

    # Prepare LSTM features
    lstm_df = add_lstm_sequences(target_df)
    lstm_feature_cols = get_no_g3_lstm_feature_cols()
    lstm_train = lstm_df[lstm_df["DATE"] <= TRAIN_VAL_END].reset_index(drop=True)
    lstm_oos = lstm_df[lstm_df["DATE"] >= OOS_START].reset_index(drop=True)

    print(f"  Train+Val (XGB): {len(xgb_train)} rows")
    print(f"  OOS 2026 (XGB) : {len(xgb_oos)} rows")
    print(f"  Train+Val (LSTM): {len(lstm_train)} rows")
    print(f"  OOS 2026 (LSTM) : {len(lstm_oos)} rows")

    if len(xgb_oos) == 0:
        print("\n⚠ No 2026 data available yet. Writing empty OOS JSON.")
        write_empty_output()
        return

    # ── Step 4: Train XGBoost ───────────────────────────────────
    print("\n[4/6] Training XGBoost...")
    xgb_params = load_xgb_params()
    xgb_model = train_xgboost(xgb_train, xgb_feature_cols, xgb_params)
    xgb_preds = predict_xgboost(xgb_model, xgb_oos, xgb_feature_cols)
    print(f"  Predictions: {len(xgb_preds)}")

    # ── Step 5: Train LSTM ──────────────────────────────────────
    print("\n[5/6] Training LSTM...")
    lstm_config = load_lstm_config()
    n_base_features = len(NO_G3_BASES)
    lstm_preds = train_and_predict_lstm(
        lstm_train, lstm_oos, lstm_feature_cols, n_base_features, lstm_config,
    )
    print(f"  Predictions: {len(lstm_preds)}")

    # ── Step 6: Assemble output ─────────────────────────────────
    print("\n[6/6] Assembling OOS JSON...")

    # Use XGBoost OOS df as reference for dates (both should align)
    today = datetime.utcnow().date()
    cutoff_date = today - timedelta(days=HORIZON + 3)  # buffer for weekends

    predictions = []
    for i in range(len(xgb_oos)):
        row = xgb_oos.iloc[i]
        obs_date = row["DATE"].strftime("%Y-%m-%d")
        tgt_date = row["TARGET_DATE"].strftime("%Y-%m-%d")

        actual_val = float(row["TARGET_5D"])
        tgt_as_date = row["TARGET_DATE"].date() if hasattr(row["TARGET_DATE"], 'date') else pd.Timestamp(row["TARGET_DATE"]).date()

        # Only include actual if the target date has passed
        has_actual = tgt_as_date <= today
        actual = actual_val if has_actual else None

        xgb_pred = float(xgb_preds[i])
        lstm_pred = float(lstm_preds[i]) if i < len(lstm_preds) else None

        err_xgb = float(actual_val - xgb_pred) if has_actual else None
        err_lstm = float(actual_val - lstm_pred) if (has_actual and lstm_pred is not None) else None

        pred_entry = {
            "observationDate": obs_date,
            "targetDate": tgt_date,
            "actual": actual,
            "predXgboost": xgb_pred,
            "predLstm": lstm_pred,
            "errXgboost": err_xgb,
            "errLstm": err_lstm,
        }
        predictions.append(pred_entry)

    # Compute aggregate metrics
    agg_metrics = compute_aggregate_metrics(predictions)

    # Data as-of date
    data_as_of = xgb_oos["DATE"].max().strftime("%Y-%m-%d")

    output = {
        "lastUpdated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dataAsOf": data_as_of,
        "predictions": predictions,
        "aggregateMetrics": agg_metrics,
    }

    # Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n  ✅ Written {len(predictions)} predictions to {OUTPUT_PATH}")
    print(f"  Data as of: {data_as_of}")
    print(f"  Predictions with actuals: {agg_metrics['nObservations']}")
    if agg_metrics.get("xgboost"):
        print(f"  XGBoost MAE: {agg_metrics['xgboost']['mae']:.6f}")
        print(f"  LSTM MAE:    {agg_metrics['lstm']['mae']:.6f}")

    print("\n" + "=" * 60)
    print("Pipeline complete!")
    print("=" * 60)


def write_empty_output():
    """Write empty OOS JSON when no 2026 data is available."""
    output = {
        "lastUpdated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dataAsOf": None,
        "predictions": [],
        "aggregateMetrics": {
            "nObservations": 0,
            "xgboost": None,
            "lstm": None,
        },
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Written empty output to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
