import requests
from flask import Blueprint, jsonify

fetch_yahoo_bp = Blueprint('fetch_yahoo', __name__)


def get_sample_data():
    """Return a small sample payload for use by different frameworks."""
    sample = {"symbol": "AAPL", "prices": [150, 151, 152, 153, 154]}
    return {"status": "ok", "data": sample}


@fetch_yahoo_bp.route('/api/fetch_yahoo', methods=['GET'])
def fetch_yahoo():
    """Flask route wrapper around `get_sample_data`."""
    try:
        return jsonify(get_sample_data())
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500
