from flask import Blueprint, request, jsonify
from sklearn.decomposition import PCA as SKPCA
import numpy as np

pca_bp = Blueprint('pca', __name__)


def compute_pca(data):
    """Compute PCA on a 2D list/array and return serializable results.

    Args:
        data: list[list[float]]

    Returns:
        dict with `components` and `explained_variance_ratio`.
    """
    X = np.array(data)
    pca = SKPCA()
    transformed = pca.fit_transform(X)
    components = transformed.tolist()
    explained = pca.explained_variance_ratio_.tolist()
    return {"components": components, "explained_variance_ratio": explained}


@pca_bp.route('/api/pca', methods=['POST'])
def run_pca():
    """Flask route wrapper around `compute_pca`."""
    try:
        payload = request.get_json() or {}
        data = payload.get('data')
        if data is None:
            return jsonify({"error": "missing 'data' field"}), 400
        return jsonify(compute_pca(data))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
