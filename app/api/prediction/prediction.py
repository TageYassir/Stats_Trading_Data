from flask import Blueprint, jsonify, request
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from PCA.pca_utils import compute_pca_features

prediction_bp = Blueprint("prediction", __name__)


def calculate_wma(series, window):
    weights = np.arange(1, window + 1)

    return series.rolling(window).apply(
        lambda prices: np.dot(prices, weights) / weights.sum(),
        raw=True
    )


def calculate_rsi(series, window=14):

    delta = series.diff()

    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.rolling(window=window).mean()
    avg_loss = loss.rolling(window=window).mean()

    rs = avg_gain / avg_loss

    rsi = 100 - (100 / (1 + rs))

    return rsi


@prediction_bp.route("/hello", methods=["GET"])
def hello():
    return jsonify({
        "message": "Prediction module working"
    })


@prediction_bp.route("/prepare", methods=["GET"])
def prepare_data():

    symbol = request.args.get("symbol", "AAPL")
    period = request.args.get("period", "1y")
    interval = request.args.get("interval", "1d")

    try:

        df = yf.download(
            symbol,
            period=period,
            interval=interval,
            progress=False,
            auto_adjust=False
        )

        if df.empty:
            return jsonify({
                "error": "No data found"
            }), 400

        # Fix MultiIndex returned by yfinance
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # ===== FEATURES =====

        df["Return"] = df["Close"].pct_change()

        df["SMA30"] = (
            df["Close"]
            .rolling(window=20)
            .mean()
        )

        df["EMA20"] = (
            df["Close"]
            .ewm(span=20, adjust=False)
            .mean()
        )

        df["WMA20"] = calculate_wma(
            df["Close"],
            20
        )

        df["RSI14"] = calculate_rsi(
            df["Close"],
            14
        )

        # ===== TARGET =====

        df["Target"] = (
            df["Close"].shift(-1) > df["Close"]
        ).astype(int)

        df = df.dropna()

        preview = []

        for _, row in df.tail(10).iterrows():

            preview.append({
                "Close": round(float(row["Close"]), 2),
                "Return": round(float(row["Return"]), 6),
                "SMA30": round(float(row["SMA30"]), 2),
                "EMA20": round(float(row["EMA20"]), 2),
                "WMA20": round(float(row["WMA20"]), 2),
                "RSI14": round(float(row["RSI14"]), 2),
                "Target": int(row["Target"])
            })

        return jsonify({
            "symbol": symbol,
            "rows": len(df),
            "features": [
                "Return",
                "SMA30",
                "EMA20",
                "WMA20",
                "RSI14"
            ],
            "target": "Target",
            "preview": preview
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
    
@prediction_bp.route("/train", methods=["GET"])
def train_model():

    symbol = request.args.get("symbol", "AAPL")
    period = request.args.get("period", "2y")
    interval = request.args.get("interval", "1d")

    try:

        df = yf.download(
            symbol,
            period=period,
            interval=interval,
            progress=False,
            auto_adjust=False
        )

        if df.empty:
            return jsonify({
                "error": "No data found"
            }), 400

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # ===== Technical Indicators =====

        df["Return"] = df["Close"].pct_change()

        df["SMA30"] = df["Close"].rolling(20).mean()

        df["EMA20"] = df["Close"].ewm(
            span=20,
            adjust=False
        ).mean()

        df["WMA20"] = calculate_wma(
            df["Close"],
            20
        )

        df["RSI14"] = calculate_rsi(
            df["Close"],
            14
        )

        # ===== Target =====

        df["Target"] = (
            df["Close"].shift(-1) > df["Close"]
        ).astype(int)

        df = df.dropna()

        # ===== PCA Features =====

        market_symbols = [
            "AAPL",
            "MSFT",
            "GOOGL",
            "AMZN",
            "NVDA"
        ]

        pca_df = compute_pca_features(
            market_symbols,
            period,
            interval
        )

        print("\n===== PCA CHECK =====")

        if pca_df is None:

            print("PCA IS NONE")

        else:

            print("PCA OK")
            print(pca_df.head())

            df.index = pd.to_datetime(
                df.index
            ).tz_localize(None)

            df = df.join(
                pca_df,
                how="inner"
            )

            print("\n===== JOIN RESULT =====")
            print(df.columns.tolist())
            print(df.shape)
            print("=======================\n")

        # ===== Features utilisées =====

        features = [
            "Return",
            "SMA30",
            "EMA20",
            "WMA20",
            "RSI14"
        ]

        if "PC1" in df.columns and "PC2" in df.columns:

            features.extend([
                "PC1",
                "PC2"
            ])

        print("\nFEATURES:")
        print(features)

        X = df[features]

        y = df["Target"]

        # ===== Train/Test Split =====

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            shuffle=False
        )

        # ===== Random Forest =====

        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            random_state=42
        )

        model.fit(
            X_train,
            y_train
        )

        # ===== Feature Importance =====

        feature_importance = {}

        for feature, importance in zip(
            features,
            model.feature_importances_
        ):

            feature_importance[feature] = round(
                float(importance),
                4
            )

        # ===== Accuracy =====

        y_pred = model.predict(
            X_test
        )

        accuracy = accuracy_score(
            y_test,
            y_pred
        )

        # ===== Latest Prediction =====

        latest_data = X.tail(1)

        prediction = model.predict(
            latest_data
        )[0]

        probability = model.predict_proba(
            latest_data
        )[0]

        confidence = max(
            probability
        ) * 100

        return jsonify({

            "symbol": symbol,

            "accuracy": round(
                accuracy * 100,
                2
            ),

            "prediction":
                "Bullish"
                if prediction == 1
                else "Bearish",

            "confidence": round(
                confidence,
                2
            ),

            "training_rows": len(df),

            "features_used": features,

            "feature_importance": feature_importance
        })

    except Exception as e:

        import traceback
        traceback.print_exc()

        return jsonify({
            "error": str(e)
        }), 500