import uvicorn
from fastapi import FastAPI
from app.api.v1.rfp import router as rfp_router
from app.api.v1.authRoutes import router as auth_router
from app.config import settings

app = FastAPI(title="SME02 RFP Orchestrator")

@app.get("/")
async def landing():
    return {"message": "Welcome to the SME02 RFP Orchestrator API!"}

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(rfp_router, prefix="/api/v1/rfp")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)