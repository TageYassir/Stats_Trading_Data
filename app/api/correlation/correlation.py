from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import yfinance as yf
import pandas as pd

router = APIRouter()

class CorrelationRequest(BaseModel):
    symbols: List[str]
    period: str = "1y"
    interval: str = "1d"

@router.post("/correlation")
async def compute_correlation(req: CorrelationRequest):
    # Use .upper() for Python
    symbols_list = [s.strip().upper() for s in req.symbols if s.strip()]
    if len(symbols_list) < 2:
        raise HTTPException(status_code=400, detail="At least 2 symbols required.")
    
    try:
        data = yf.download(tickers=symbols_list, period=req.period, interval=req.interval, progress=False)
        if data.empty:
            raise HTTPException(status_code=404, detail="No historical data found.")
        
        # Select adjusted close or regular close
        close_df = data['Adj Close'] if 'Adj Close' in data.columns and not data['Adj Close'].empty else data['Close']
        if len(symbols_list) == 1:
            close_df = close_df.to_frame(name=symbols_list[0])
            
        returns_df = close_df.dropna(how='all').ffill().pct_change().dropna()
        corr_matrix = returns_df.corr(method='pearson').reindex(index=symbols_list, columns=symbols_list).fillna(0.0)
        
        return {
            "symbols": symbols_list,
            "matrix": corr_matrix.values.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))