import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.rfp import router as rfp_router
from app.api.v1.authRoutes import router as auth_router
from app.config import settings

app = FastAPI(title="SME02 RFP Orchestrator")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://localhost:5174",   # Vite fallback port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def landing():
    return {"message": "Welcome to the SME02 RFP Orchestrator API!"}

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(rfp_router, prefix="/api/v1/rfp")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)