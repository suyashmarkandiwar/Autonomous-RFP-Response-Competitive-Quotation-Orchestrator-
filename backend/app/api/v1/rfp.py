from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.graph import rfp_agent_app
from app.services.pdf import generate_pdf
from app.db.mongodb import rfp_quotes_collection

router = APIRouter()

class RFPRequest(BaseModel):
    client_name: str
    rfp_text: str

@router.post("/process-rfp")
async def process_rfp(request: RFPRequest):
    initial_state = {
        "client_name": request.client_name,
        "rfp_text": request.rfp_text,
        "parsed_items": [], "pricing_strategy": "", 
        "executive_summary": "", "pdf_file_path": ""
    }
    
    final_state = rfp_agent_app.invoke(initial_state)
    pdf_path = generate_pdf(request.client_name, final_state["executive_summary"], final_state["parsed_items"])
    
    quote_record = {
        "client_name": request.client_name, "rfp_text": request.rfp_text,
        "parsed_items": final_state["parsed_items"], "pricing_strategy": final_state["pricing_strategy"],
        "executive_summary": final_state["executive_summary"], "pdf_file_path": pdf_path,
        "status": "Pending Approval"
    }
    rfp_quotes_collection.insert_one(quote_record)
    quote_record.pop("_id", None)
    
    return {"message": "Quotation generated!", "data": quote_record}

