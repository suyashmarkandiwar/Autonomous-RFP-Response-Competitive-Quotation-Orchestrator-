from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="SME02 Orchestrator API")

# The exact data shape we expect to receive (The RFP)
class RFPRequest(BaseModel):
    client_name: str
    rfp_text: str
    target_currency: str = "USD"
    region: str = "US"

@app.post("/api/v1/process-rfp")
async def process_rfp(request: RFPRequest):
    # Later, LangGraph goes here. For now, we verify data flow.
    return {
        "status": "success",
        "message": f"RFP received for {request.client_name}.",
        "received_text": request.rfp_text,
        "next_step": "Ready to send to LangGraph Parser Agent."
    }

if __name__ == "__main__":
    import uvicorn
    # reload=True automatically restarts the server when you save code changes
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)