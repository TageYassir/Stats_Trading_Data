from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import logging

# Import your existing blueprints (they should work as before)
try:
    from .fetch_yahoo.fetch_yahoo import fetch_yahoo_bp
    from .PCA.pca import pca_bp
    from .indicators.indicators import indicators_bp
    from .statistics.statistics import statistics_bp
except Exception:
    from fetch_yahoo.fetch_yahoo import fetch_yahoo_bp
    from PCA.pca import pca_bp
    from indicators.indicators import indicators_bp
    from statistics.statistics import statistics_bp
# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # CORS - allow your React frontend
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    
    # Register your existing blueprints
    app.register_blueprint(fetch_yahoo_bp)
    app.register_blueprint(pca_bp)
    app.register_blueprint(indicators_bp)
    app.register_blueprint(statistics_bp)
    
    # Health check (already present)
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok"})
    
    # ---------- NEW: Correlation endpoint ----------
    @app.route('/api/correlation', methods=['POST', 'OPTIONS'])
    def correlation():
        # Handle preflight OPTIONS manually (CORS already does, but explicit is safe)
        if request.method == 'OPTIONS':
            return '', 200
        
        data = request.get_json()
        if not data:
            return jsonify({"detail": "Invalid JSON"}), 400
        
        symbols = data.get('symbols', [])
        period = data.get('period', '1y')
        interval = data.get('interval', '1d')
        
        symbols_list = [s.strip().upper() for s in symbols if s.strip()]
        if len(symbols_list) < 2:
            return jsonify({"detail": "At least 2 symbols required"}), 400
        
        try:
            # Download data
            df = yf.download(tickers=symbols_list, period=period, interval=interval, progress=False)
            if df.empty:
                return jsonify({"detail": "No historical data found"}), 404
            
            # Use adjusted close if available
            close_df = df['Adj Close'] if 'Adj Close' in df.columns and not df['Adj Close'].empty else df['Close']
            if len(symbols_list) == 1:
                close_df = close_df.to_frame(name=symbols_list[0])
            
            # Calculate returns and correlation
            returns_df = close_df.dropna(how='all').ffill().pct_change().dropna()
            corr_matrix = returns_df.corr(method='pearson').reindex(index=symbols_list, columns=symbols_list).fillna(0.0)
            
            return jsonify({
                "symbols": symbols_list,
                "matrix": corr_matrix.values.tolist()
            })
        except Exception as e:
            logger.exception("Correlation error")
            return jsonify({"detail": str(e)}), 500
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=True)