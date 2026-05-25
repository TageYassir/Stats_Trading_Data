from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# Try imports that work both when running as a package and as a script
try:
    from .fetch_yahoo.fetch_yahoo import get_sample_data
    from .PCA.pca import compute_pca
except Exception:
    from fetch_yahoo.fetch_yahoo import get_sample_data
    from PCA.pca import compute_pca

app = FastAPI(title="Stats Trading API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id, "value": f"Item {item_id}"}


@app.get("/api/fetch_yahoo")
async def fetch_yahoo_endpoint():
    try:
        return get_sample_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pca")
async def pca_endpoint(payload: dict):
    data = payload.get("data") if payload else None
    if data is None:
        raise HTTPException(status_code=400, detail="missing 'data' field")
    try:
        return compute_pca(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/")
async def root():
    """Redirect root to the interactive docs for convenience."""
    return RedirectResponse(url="/docs")
