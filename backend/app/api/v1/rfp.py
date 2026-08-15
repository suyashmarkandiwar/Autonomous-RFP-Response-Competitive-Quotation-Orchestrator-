import io
import json
import os
import uuid
from enum import Enum
from typing import List, Optional

import PyPDF2
import pytesseract
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from PIL import Image
from pydantic import BaseModel

from app.agents.graph import analysis_app, generation_app
from app.api.v1.authRoutes import get_current_user
from app.config import settings
from app.db.mongodb import rfp_quotes_collection
from app.services.pdf import generate_pdf


pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH


router = APIRouter()

# Strategy Dropdown Options
class StrategyEnum(str, Enum):
    UNDERCUT = "Undercut (-5%)"
    MATCH = "Match Market Avg"
    VALUE_BUNDLE = "Value-Bundle (+8%)"
    MARGIN_MAXIMIZER = "Margin-Maximizer"
    MARKET_PENETRATION = "Market-Penetration"

# Input Model
class RFPAnalyzeRequest(BaseModel):
    rfp_text: str

# Output Models
class ParsedItem(BaseModel):
    item_id: str
    category: str
    item_name: str
    quantity: int
    unit: str
    specifications: str

class CompetitorDetail(BaseModel):
    competitor_name: str
    market_tier: str
    est_market_share: int  # Percentage
    unit_price: float
    price_delta_vs_quote: str # e.g., "-₹600 (-7.7%)"

class PricingData(BaseModel):
    item_id: str
    internal_cost: float
    competitor_details: List[CompetitorDetail] = []
    competitor_avg: float
    competitor_range_min: float
    competitor_range_max: float
    competitor_sources: int
    selected_strategy: StrategyEnum
    available_strategies: List[str] = [e.value for e in StrategyEnum]
    ai_rationale: str
    human_price_override: Optional[float] = None
    margin_percentage: float
    total_profit: float

class RFPAnalyzeResponse(BaseModel):
    parsed_items: List[ParsedItem]
    pricing_analysis: List[PricingData]

class StrategyUpdateRequest(BaseModel):
    item_id: str
    item_name: str
    new_strategy: StrategyEnum
    base_cost: float
    competitor_price: float
    quantity: int

class RecalculateResponse(BaseModel):
    item_id: str
    updated_strategy: StrategyEnum
    new_ai_rationale: str
    new_human_price_override: float
    margin_percentage: float
    total_profit: float

class UploadRFPResponse(BaseModel):
    filename: str
    size: int
    extracted_text: str

# Models for Approval & Generation
class ApprovedLineItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    final_price: float

class ApproveAndGenerateRequest(BaseModel):
    rfp_title: str
    client_name: str
    approved_items: List[ApprovedLineItem]

class RegenerateRequest(BaseModel):
    html_content: str

class ApproveAndGenerateResponse(BaseModel):
    quote_id: str
    total_quoted_value: float
    status: str


@router.post("/upload-rfp", response_model=UploadRFPResponse)
async def upload_rfp(
    file: UploadFile = File(...), 
    current_user: str = Depends(get_current_user)
):
    """
    Input: Uploaded PDF or Image file
    Action: Detects file type & extracts text (PyPDF/pdfplumber for PDF, Tesseract/OCR for images)
    Output: Extracted raw RFP text ready for /analyze
    """
    
    contents = await file.read()
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max size is 10MB.")
        
    file_type = file.content_type
    extracted_text = ""
    
    try:
        # 1. Handle PDF
        if file_type == "application/pdf":
            # ADDED: io.BytesIO to read from memory instead of saving to disk
            # ADDED: PyPDF2 logic to iterate through pages and extract text
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"

        # 2. Handle Image (PNG/JPG)
        elif file_type in ["image/png", "image/jpeg", "image/jpg"]:
            # ADDED: PIL.Image to open the memory buffer
            # ADDED: pytesseract to run OCR on the image object
            image = Image.open(io.BytesIO(contents))
            extracted_text = pytesseract.image_to_string(image)
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Upload PDF or Image.")
        
    except Exception as e:
        # 4. Handle unexpected errors during file processing
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")
        
    return {
        "filename": file.filename,
        "size": len(contents),
        "extracted_text": extracted_text.strip()
    }

@router.post("/analyze", response_model=RFPAnalyzeResponse)
async def analyze_rfp(request: RFPAnalyzeRequest, current_user: str = Depends(get_current_user)):
    # 1. Run Graph 1 (Parser & Pricing Agents)
    graph_result = analysis_app.invoke({"rfp_text": request.rfp_text})
    
    # 2. Map results (Note: Ensure your pricing.py outputs match these exact Pydantic fields)
    parsed_items = graph_result.get("parsed_items", [])
    pricing_analysis = graph_result.get("pricing_data", []) 
    
    return {
        "parsed_items": parsed_items,
        "pricing_analysis": pricing_analysis
    }

# Initialize LLM directly for this endpoint
recalc_llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY)

@router.post("/recalculate", response_model=RecalculateResponse)
async def recalculate_strategy(request: StrategyUpdateRequest, current_user: str = Depends(get_current_user)):
    """
    Input: Item ID and the newly selected Strategy
    Action: LangGraph Pricing Agent recalculates price and writes a new rationale.
    Output: Updated price, margin, and rationale.
    """

    prompt = """
    You are a B2B Pricing Strategy Agent.
    Item: {item_name}
    Our Base Cost: {base_cost}
    Competitor Price: {comp_price}
    Requested Strategy: {strategy}

    Calculate a new recommended price that strictly follows the Requested Strategy.
    Return ONLY a valid JSON object with exactly two keys:
    - "rationale": A 1-sentence explanation of the new price.
    - "new_price": The newly calculated unit price (number).
    """

    chain = PromptTemplate.from_template(prompt) | recalc_llm
    response = chain.invoke({
        "item_name": request.item_name,
        "base_cost": request.base_cost,
        "comp_price": request.competitor_price,
        "strategy": request.new_strategy.value
    })

    content_str = response.content[0]["text"] if isinstance(response.content, list) else response.content
    clean_json = content_str.strip().removeprefix("```json").removesuffix("```").strip()
    
    try:
        ai_decision = json.loads(clean_json)
    except json.JSONDecodeError:
        ai_decision = {"rationale": "Fallback strategy applied.", "new_price": request.base_cost * 1.1}

    new_price = float(ai_decision.get("new_price", request.base_cost * 1.1))
    new_rationale = ai_decision.get("rationale", "Strategy updated.")

    # Calculate new margins
    new_margin = round((new_price - request.base_cost) / new_price * 100, 1) if new_price > 0 else 0.0
    new_profit = round((new_price - request.base_cost) * request.quantity, 2)

    return {
        "item_id": request.item_id,
        "updated_strategy": request.new_strategy,
        "new_ai_rationale": new_rationale,
        "new_human_price_override": new_price,
        "margin_percentage": new_margin,
        "total_profit": new_profit
    }
    

@router.post("/approve-and-generate", response_model=ApproveAndGenerateResponse)
async def approve_and_generate(
    request: ApproveAndGenerateRequest, 
    current_user: str = Depends(get_current_user)
):
    """
    Input: Final approved items and human overrides
    Action: Runs Agent 3 (Drafter) to draft executive summary, build PDF, save metadata to MongoDB
    Output: Quote ID and success status
    """
    total_value = sum(item.quantity * item.final_price for item in request.approved_items)
    quote_id = f"QT-{uuid.uuid4().hex[:6].upper()}"

    # 1. Format payload for Graph 2
    state_input = {
        "rfp_title": request.rfp_title,
        "client_name": request.client_name,
        "approved_items": [item.model_dump() for item in request.approved_items]
    }
    
    # 2. Run Graph 2 (Drafter Agent)
    graph_result = generation_app.invoke(state_input)
    executive_summary = graph_result.get("executive_summary","")
    
    # 3. Generate PDF
    pdf_path, html_content = generate_pdf(
        client_name=request.client_name,
        rfp_title=request.rfp_title,
        executive_summary=executive_summary,
        approved_items=state_input["approved_items"],
        quote_id=quote_id
    )   

    # 4. Save quote metadata to MongoDB
    rfp_quotes_collection.insert_one({
        "quote_id":          quote_id,
        "client_name":       request.client_name,
        "rfp_title":         request.rfp_title,
        "approved_items":    state_input["approved_items"],
        "total_value":       total_value,
        "executive_summary": executive_summary,
        "pdf_path":          pdf_path,
        "html_content":      html_content,
        "status":            "Generated"
    })

    return {
        "quote_id": quote_id,
        "total_quoted_value": total_value,
        "status": "PDF generated and saved successfully."
    }

@router.get("/preview-pdf/{quote_id}")
async def preview_pdf(quote_id: str, current_user: str = Depends(get_current_user)):
    """
    Action: Retrieves PDF path from MongoDB and returns the file for preview
    """
    # Fetch real PDF path from MongoDB using quote_id
    quote_record = rfp_quotes_collection.find_one({"quote_id": quote_id})
    if not quote_record:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")

    pdf_path = quote_record.get("pdf_path", "")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF file for {quote_id} not found on server.")

    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{quote_id}.pdf")

@router.get("/preview-html/{quote_id}")
async def preview_html(quote_id: str, current_user: str = Depends(get_current_user)):
    """
    Action: Retrieves the raw HTML for the quote so it can be previewed/edited in the browser.
    """
    quote_record = rfp_quotes_collection.find_one({"quote_id": quote_id})
    if not quote_record:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")

    html_content = quote_record.get("html_content", "")
    return {"html_content": html_content}

@router.post("/regenerate-pdf/{quote_id}")
async def regenerate_pdf(quote_id: str, request: RegenerateRequest, current_user: str = Depends(get_current_user)):
    """
    Action: Accepts raw edited HTML from the frontend, saves it, and regenerates the underlying PDF file.
    """
    quote_record = rfp_quotes_collection.find_one({"quote_id": quote_id})
    if not quote_record:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")
        
    pdf_path = quote_record.get("pdf_path", "")
    if not pdf_path:
        # Fallback to current dir if missing
        pdf_path = os.path.join(os.getcwd(), f"{quote_id}.pdf")
        
    # Overwrite the PDF with the edited HTML
    from xhtml2pdf import pisa
    from app.services.pdf import fetch_resources
    with open(pdf_path, "w+b") as pdf_file:
        pisa.CreatePDF(request.html_content, dest=pdf_file, link_callback=fetch_resources)
        
    # Update HTML in DB
    rfp_quotes_collection.update_one(
        {"quote_id": quote_id},
        {"$set": {"html_content": request.html_content}}
    )
    
    return {"status": "Success", "message": "PDF regenerated successfully."}

@router.get("/download-pdf/{quote_id}")
async def download_pdf(quote_id: str, current_user: str = Depends(get_current_user)):
    """
    Action: Retrieves PDF path from MongoDB and returns the file for download
    """
    # Fetch real PDF path from MongoDB using quote_id
    quote_record = rfp_quotes_collection.find_one({"quote_id": quote_id})
    if not quote_record:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")

    pdf_path = quote_record.get("pdf_path", "")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF file for {quote_id} not found on server.")

    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{quote_id}.pdf")