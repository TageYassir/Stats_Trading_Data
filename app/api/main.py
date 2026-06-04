from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
import logging

app = FastAPI(title="SEAP - Stock Exchange Analytics Platform")

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- FOREX & COMMODITY MAPPING ----------
SYMBOL_MAP = {
    # Forex (Yahoo Finance requires =X suffix)
    'EURUSD': 'EURUSD=X',
    'GBPUSD': 'GBPUSD=X',
    'USDJPY': 'USDJPY=X',
    'USDCHF': 'USDCHF=X',
    'USDCAD': 'USDCAD=X',
    'AUDUSD': 'AUDUSD=X',
    'NZDUSD': 'NZDUSD=X',
    'EURGBP': 'EURGBP=X',
    'EURJPY': 'EURJPY=X',
    'GBPJPY': 'GBPJPY=X',
    # Commodities
    'XAUUSD': 'GC=F',   # Gold
    'XAGUSD': 'SI=F',   # Silver
    'XPTUSD': 'PL=F',   # Platinum
    'XPDUSD': 'PA=F',   # Palladium
    # Crypto
    'BTCUSD': 'BTC-USD',
    'ETHUSD': 'ETH-USD',
}

INTERVAL_MAP = {
    '1m': '1m', '2m': '2m', '5m': '5m', '15m': '15m', '30m': '30m',
    '45m': '45m', '1h': '1h', '90m': '90m', '2h': '2h', '4h': '4h',
    '1d': '1d', '5d': '5d', '1wk': '1wk', '1mo': '1mo', '3mo': '3mo'
}

def get_yf_symbol(user_symbol: str) -> str:
    """Convert user-friendly symbol to Yahoo Finance format."""
    upper = user_symbol.upper()
    if upper in SYMBOL_MAP:
        return SYMBOL_MAP[upper]
    if upper.endswith('=X'):  # already in Yahoo format
        return upper
    return upper  # stocks like AAPL, MSFT

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/fetch_yahoo")
async def fetch_yahoo(
    symbol: str = Query("AAPL"),
    period: str = Query("1y"),
    interval: str = Query("1d")
):
    try:
        yf_symbol = get_yf_symbol(symbol)
        logger.info(f"Fetching {symbol} -> {yf_symbol}, period={period}, interval={interval}")

        if interval not in INTERVAL_MAP:
            raise HTTPException(400, f"Invalid interval. Available: {list(INTERVAL_MAP.keys())}")
        yf_interval = INTERVAL_MAP[interval]

        # Minute data is limited to 60 days by yfinance
        if interval in ['1m','2m','5m','15m','30m','45m'] and period in ['1y','2y','5y','10y','max']:
            period = '60d'
            logger.info(f"Minute data limited to 60 days, using period={period}")

        df = yf.download(yf_symbol, period=period, interval=yf_interval, progress=False)
        if df.empty:
            raise HTTPException(404, f"No data for {symbol} (mapped to {yf_symbol})")

        df = df.reset_index()
        # Rename columns to match frontend expectations
        df.rename(columns={'Date': 'date', 'Close': 'close', 'Open': 'open',
                           'High': 'high', 'Low': 'low', 'Volume': 'volume'}, inplace=True)
        df['date'] = df['date'].astype(str)

        # Build the exact structure your React frontend expects
        prices = df[['date', 'close']].rename(columns={'date': 'Date', 'close': 'Close'}).to_dict('records')
        # Also keep original fields for candlestick
        for i, row in df.iterrows():
            prices[i]['Open'] = row['open']
            prices[i]['High'] = row['high']
            prices[i]['Low'] = row['low']
            prices[i]['Volume'] = row['volume']

        return {
            "data": {"prices": prices},
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "status": "ok",
            "count": len(prices)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in fetch_yahoo")
        raise HTTPException(500, str(e))

@app.post("/api/pca")
async def pca_endpoint(payload: dict):
    symbols = payload.get("symbols", [])
    period = payload.get("period", "1y")
    interval = payload.get("interval", "1d")

    if len(symbols) < 2:
        raise HTTPException(400, "At least 2 symbols required")

    try:
        yf_symbols = [get_yf_symbol(s) for s in symbols]
        data = yf.download(yf_symbols, period=period, interval=interval, progress=False, group_by='ticker')
        if data.empty:
            raise HTTPException(404, "No data for symbols")

        # Extract closing prices
        close_df = pd.DataFrame()
        if len(symbols) == 1:
            close_df[symbols[0]] = data['Close']
        else:
            for i, sym in enumerate(symbols):
                yf_sym = yf_symbols[i]
                try:
                    if isinstance(data.columns, pd.MultiIndex):
                        close_df[sym] = data['Close'][yf_sym]
                    else:
                        close_df[sym] = data['Close']
                except:
                    close_df[sym] = data[yf_sym]['Close']

        close_df = close_df.dropna()
        if len(close_df) < 10:
            raise HTTPException(400, "Insufficient overlapping data")

        returns = close_df.pct_change().dropna()
        pca = PCA()
        pca.fit(returns)
        return {
            "symbols": symbols,
            "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
            "transformed_data": pca.transform(returns)[:100].tolist()
        }
    except Exception as e:
        logger.exception("PCA error")
        raise HTTPException(500, str(e))

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")