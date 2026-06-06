from flask import Flask, jsonify
from flask_cors import CORS

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

def create_app():
    app = Flask(__name__)
    
    # This fixes your CORS errors completely for Flask
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    app.register_blueprint(fetch_yahoo_bp)
    app.register_blueprint(pca_bp)
    app.register_blueprint(indicators_bp)
    app.register_blueprint(statistics_bp)
    
    # Fixes the 404 / Unexpected token '<' error
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok"})
        
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=True)