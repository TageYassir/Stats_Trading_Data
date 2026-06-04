from flask import Blueprint, request, jsonify
import yfinance as yf
import pandas as pd
from sklearn.decomposition import PCA as SKPCA
import numpy as np
import traceback

pca_bp = Blueprint('pca', __name__)

@pca_bp.route('/api/pca', methods=['POST'])
def run_pca():
    try:
        payload = request.get_json() or {}
        symbols = payload.get('symbols', [])
        period = payload.get('period', '1y')
        interval = payload.get('interval', '1d')

        if not symbols or len(symbols) < 2:
            return jsonify({"error": "At least 2 symbols required for PCA"}), 400

        # 1. Fetch data for all requested symbols
        df_list = []
        valid_symbols = []
        
        for sym in symbols:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period=period, interval=interval)
            if not hist.empty:
                series = hist['Close'].rename(sym)
                df_list.append(series)
                valid_symbols.append(sym)
        
        if len(df_list) < 2:
            return jsonify({"error": "Could not fetch enough valid data for the provided symbols."}), 400
            
        # 2. Combine and clean the data
        combined_df = pd.concat(df_list, axis=1).dropna()
        
        if combined_df.empty or len(combined_df) < 2:
            return jsonify({"error": "Not enough overlapping dates to perform PCA."}), 400
            
        # 3. Calculate Daily/Interval Returns (CRITICAL for valid financial PCA)
        returns_df = combined_df.pct_change().dropna()
        
        # 4. Standardize the data (Mean=0, Variance=1)
        X = returns_df.values
        X_std = (X - np.mean(X, axis=0)) / np.std(X, axis=0)
        
        # 5. Compute PCA
        pca = SKPCA()
        transformed = pca.fit_transform(X_std)
        
        components = pca.components_.tolist() 
        explained = pca.explained_variance_ratio_.tolist()
        
        return jsonify({
            "symbols": valid_symbols,
            "explained_variance_ratio": explained,
            "components": components, # The weights of each stock in the components
            "transformed_data": transformed.tolist()[:5] # Just top 5 rows to save payload size
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500