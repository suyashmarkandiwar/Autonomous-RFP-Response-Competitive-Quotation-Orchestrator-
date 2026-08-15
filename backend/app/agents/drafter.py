from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from app.agents.state import DrafterState
from app.config import settings

# Initialize Agent 3 (Drafter) LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY)


def _format_approved_items(approved_items: list) -> str:
    """
    Converts the approved_items list into a readable summary string
    for the LLM prompt.
    Example output:
        - 50x Enterprise Laptop @ ₹1,200 each (Total: ₹60,000)
        - 2x Database Server @ ₹8,500 each (Total: ₹17,000)
    """
    lines = []
    for item in approved_items:
        name     = item.get("item_name", "Item")
        qty      = item.get("quantity", 1)
        price    = item.get("final_price", 0.0)
        total    = qty * price
        lines.append(f"- {qty}x {name} @ ₹{price:,.2f} each (Total: ₹{total:,.2f})")
    return "\n".join(lines) if lines else "No items provided."


def drafter_node(state: DrafterState):
    client_name    = state.get("client_name", "Valued Client")
    rfp_title      = state.get("rfp_title", "RFP")
    approved_items = state.get("approved_items", [])

    # Format the approved items into a readable string for the prompt
    items_summary = _format_approved_items(approved_items)

    prompt = """
    You are a senior B2B Proposal Writer. Write a professional executive summary for the following quotation.

    Client: {client_name}
    RFP Title: {rfp_title}

    Approved Line Items:
    {items_summary}

    Rules:
    - Write exactly 2 concise paragraphs.
    - Paragraph 1: Highlight the value we are delivering (reliability, competitive pricing, support).
    - Paragraph 2: Summarize the total scope and why our offer is the right choice.
    - NEVER mention competitors directly. Use phrases like "market-leading value" or "industry benchmarks".
    - Output ONLY the two paragraphs. No titles, no bullet points, no introductory text.
    """

    chain = PromptTemplate.from_template(prompt) | llm
    response = chain.invoke({
        "client_name":    client_name,
        "rfp_title":      rfp_title,
        "items_summary":  items_summary,
    })

    # Safely extract text whether content is a string or a list
    content_str = (
        response.content[0]["text"]
        if isinstance(response.content, list)
        else response.content
    )

    return {"executive_summary": content_str.strip()}
