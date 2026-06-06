from flask import Blueprint, request, jsonify
import yfinance as yf
import pandas as pd
import numpy as np
import traceback

statistics_bp = Blueprint("statistics", __name__)


def calculate_max_drawdown(close_series):
    cumulative_max = close_series.cummax()
    drawdown = (close_series - cumulative_max) / cumulative_max
    return float(drawdown.min())


@statistics_bp.route("/api/statistics", methods=["POST", "OPTIONS"])
def compute_statistics():
    if request.method == "OPTIONS":
        return "", 200

    try:
        payload = request.get_json() or {}

        symbol = payload.get("symbol", "AAPL").strip().upper()
        period = payload.get("period", "1y")
        interval = payload.get("interval", "1d")
        risk_free_rate = float(payload.get("risk_free_rate", 0.0))

        if not symbol:
            return jsonify({"detail": "Symbol is required"}), 400

        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return jsonify({"detail": "No historical data found"}), 404

        if "Close" not in df.columns:
            return jsonify({"detail": "Close price not found"}), 404

        df = df.reset_index()

        date_column = "Date"
        if "Date" not in df.columns and "Datetime" in df.columns:
            date_column = "Datetime"

        close = df["Close"].dropna()
        returns = close.pct_change().dropna()

        if len(close) < 2 or len(returns) < 1:
            return jsonify({"detail": "Not enough data to calculate statistics"}), 400

        periods_per_year = 252

        if interval == "1wk":
            periods_per_year = 52
        elif interval == "1mo":
            periods_per_year = 12
        elif interval in ["1h", "4h"]:
            periods_per_year = 252 * 6

        mean_return = returns.mean()
        volatility = returns.std() * np.sqrt(periods_per_year)

        if returns.std() == 0:
            sharpe_ratio = 0.0
        else:
            sharpe_ratio = ((mean_return * periods_per_year) - risk_free_rate) / volatility

        cumulative_return = (close.iloc[-1] / close.iloc[0]) - 1
        max_drawdown = calculate_max_drawdown(close)

        stats = {
            "mean_close": float(close.mean()),
            "median_close": float(close.median()),
            "std_close": float(close.std()),
            "variance_close": float(close.var()),
            "min_close": float(close.min()),
            "max_close": float(close.max()),
            "first_close": float(close.iloc[0]),
            "last_close": float(close.iloc[-1]),
            "average_return": float(mean_return),
            "annualized_return": float(mean_return * periods_per_year),
            "volatility": float(volatility),
            "cumulative_return": float(cumulative_return),
            "max_drawdown": float(max_drawdown),
            "sharpe_ratio": float(sharpe_ratio),
            "skewness": float(returns.skew()),
            "kurtosis": float(returns.kurtosis())
        }

        returns_data = []
        for i in range(1, len(df)):
            previous_close = df.loc[i - 1, "Close"]
            current_close = df.loc[i, "Close"]

            if previous_close != 0:
                returns_data.append({
                    "Date": str(df.loc[i, date_column]),
                    "Return": float((current_close - previous_close) / previous_close)
                })

        return jsonify({
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "rows": len(df),
            "statistics": stats,
            "returns": returns_data[-200:]
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500