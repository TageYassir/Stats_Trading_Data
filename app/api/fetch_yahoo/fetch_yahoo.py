import yfinance as yf
from flask import Blueprint, jsonify, request
import traceback

fetch_yahoo_bp = Blueprint('fetch_yahoo', __name__)

@fetch_yahoo_bp.route('/api/fetch_yahoo', methods=['GET'])
def fetch_yahoo():
    try:
        print("=== Fetch Yahoo Route Called ===")
        symbol = request.args.get('symbol', 'AAPL')
        period = request.args.get('period', '1y')
        interval = request.args.get('interval', '1d')
        
        print(f"Symbol: {symbol}, Period: {period}, Interval: {interval}")
        
        # Test if yfinance is working
        print("Testing yfinance import...")
        
        ticker = yf.Ticker(symbol)
        print(f"Created ticker for {symbol}")
        
        stock_data = ticker.history(period=period, interval=interval)
        print(f"Got history, rows: {len(stock_data)}")
        
        if stock_data.empty:
            print("No data found")
            return jsonify({"status": "error", "error": f"No data found for {symbol}"}), 404
        
        # Format data - Now including Full OHLC for Candlestick rendering
        formatted_data = []
        for date, row in stock_data.iterrows():
            # Using str(date) ensures we keep hours/minutes for intraday intervals (1h, 4h)
            date_str = str(date)
            
            formatted_data.append({
                'Date': date_str,
                'date': date_str,
                'Open': float(row['Open']),
                'open': float(row['Open']),
                'High': float(row['High']),
                'high': float(row['High']),
                'Low': float(row['Low']),
                'low': float(row['Low']),
                'Close': float(row['Close']),
                'close': float(row['Close']),
                'Volume': int(row.get('Volume', 0)),
                'volume': int(row.get('Volume', 0))
            })
        
        print(f"Formatted {len(formatted_data)} records")
        
        return jsonify({
            "data": {"prices": formatted_data},
            "symbol": symbol,
            "status": "ok"
        })
        
    except Exception as e:
        print("=== ERROR OCCURRED ===")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        return jsonify({"status": "error", "error": str(e)}), 500