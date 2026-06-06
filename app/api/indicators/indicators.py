from flask import Blueprint, request, jsonify
import yfinance as yf
import pandas as pd
import numpy as np
import traceback

indicators_bp = Blueprint("indicators", __name__)


def compute_wma(series, window):
    weights = np.arange(1, window + 1)

    return series.rolling(window).apply(
        lambda prices: np.dot(prices, weights) / weights.sum(),
        raw=True
    )


@indicators_bp.route("/api/indicators", methods=["POST", "OPTIONS"])
def compute_indicators():
    if request.method == "OPTIONS":
        return "", 200

    try:
        payload = request.get_json() or {}

        symbol = payload.get("symbol", "AAPL").strip().upper()
        period = payload.get("period", "1y")
        interval = payload.get("interval", "1d")
        window = int(payload.get("window", 20))

        if not symbol:
            return jsonify({"detail": "Symbol is required"}), 400

        if window < 2:
            return jsonify({"detail": "Window must be greater than 1"}), 400

        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return jsonify({"detail": "No historical data found"}), 404

        if "Close" not in df.columns:
            return jsonify({"detail": "Close price not found"}), 404

        if len(df) < window:
            return jsonify({
                "detail": f"Not enough data for this window. Window={window}, available rows={len(df)}"
            }), 400

        df = df.reset_index()

        date_column = "Date"
        if "Date" not in df.columns and "Datetime" in df.columns:
            date_column = "Datetime"

        df["SMA"] = df["Close"].rolling(window=window).mean()
        df["EMA"] = df["Close"].ewm(span=window, adjust=False).mean()
        df["WMA"] = compute_wma(df["Close"], window)

        result = df[[date_column, "Close", "SMA", "EMA", "WMA"]].dropna()

        result[date_column] = result[date_column].astype(str)

        records = []
        for _, row in result.iterrows():
            records.append({
                "Date": row[date_column],
                "Close": float(row["Close"]),
                "SMA": float(row["SMA"]),
                "EMA": float(row["EMA"]),
                "WMA": float(row["WMA"])
            })

        return jsonify({
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "window": window,
            "rows": len(records),
            "data": records
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500