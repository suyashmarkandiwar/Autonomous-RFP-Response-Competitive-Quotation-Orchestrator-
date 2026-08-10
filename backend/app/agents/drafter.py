from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from app.agents.state import GraphState
from app.config import settings

# Initialize Agent 3
llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", api_key=settings.GEMINI_API_KEY)

def drafter_node(state: GraphState):
    client_name = state.get("client_name", "Valued Client")
    strategies = state.get("pricing_strategy", "")
    
    prompt = """
    You are a B2B Proposal Drafter. Write a short, professional 2-paragraph executive summary for a quotation to {client_name}.
    Base it on these internal pricing strategies: {strategies}
    
    Rules:
    - Focus on the value provided (e.g., complimentary warranties, competitive pricing).
    - NEVER mention "competitors" directly. Frame it as "market-leading value" or "exclusive benefits".
    - Output ONLY the bullet points, using standard markdown asterisks (*). Do not include introductory text.
    """
    
    chain = PromptTemplate.from_template(prompt) | llm
    response = chain.invoke({"client_name": client_name, "strategies": strategies})
    
    # Safely extract text
    content_str = response.content[0]["text"] if isinstance(response.content, list) else response.content
    
    return {"executive_summary": content_str.strip()}

