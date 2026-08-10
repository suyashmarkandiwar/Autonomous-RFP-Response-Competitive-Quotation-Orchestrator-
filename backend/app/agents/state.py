from typing import TypedDict, List, Dict, Any

#Any tells Python that a variable can be of any data type (string, integer, boolean, float, etc.).
class GraphState(TypedDict):
    client_name: str
    rfp_text: str
    
    # Agent 1 (Parser) populates this
    parsed_items: List[Dict[str, Any]]
    
    # Agent 2 (Pricing) populates this
    pricing_strategy: str
    
    executive_summary: str
    # Agent 3 (Drafter) populates this
    pdf_file_path: str