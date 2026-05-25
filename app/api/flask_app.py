from flask import Flask

# Import blueprints safely whether running as package or script
try:
    from .fetch_yahoo.fetch_yahoo import fetch_yahoo_bp
    from .PCA.pca import pca_bp
except Exception:
    from fetch_yahoo.fetch_yahoo import fetch_yahoo_bp
    from PCA.pca import pca_bp


def create_app():
    app = Flask(__name__)
    app.register_blueprint(fetch_yahoo_bp)
    app.register_blueprint(pca_bp)
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
