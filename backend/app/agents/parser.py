import json
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from app.agents.state import AnalysisState
from app.config import settings

# Initialize the LLM using Groq
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY)

def parse_rfp_node(state: AnalysisState):
    prompt = """
    Extract the required items and quantities from the following RFP text.
    Return ONLY a valid JSON list of dictionaries with keys "item_name" and "qty".
    CRITICAL: Ensure "item_name" is always singular (e.g., "Enterprise Laptop" not "Enterprise Laptops").
    Do not include any other text.
    
    RFP Text: {rfp_text}
    """
    
    chain = PromptTemplate.from_template(prompt) | llm
    response = chain.invoke({"rfp_text": state["rfp_text"]})

    # Safely extract text whether it is a string or a list
    content_str = response.content[0]["text"] if isinstance(response.content, list) else response.content
    
    # Strip markdown formatting and parse into a Python list
    clean_json = content_str.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        extracted_items = json.loads(clean_json)
    except json.JSONDecodeError:
        print(f"Failed to parse JSON from AI: {clean_json}")
        extracted_items = [] # Fallback
    
    # Return the updated state
    return {"parsed_items": extracted_items}

