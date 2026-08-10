import json
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from app.agents.state import GraphState
from app.db.mongodb import inventory_collection, competitors_collection
from app.config import settings

# Initialize the 2nd Agent
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", api_key=settings.GEMINI_API_KEY)

def pricing_node(state: GraphState):
    parsed_items = state.get("parsed_items", [])
    priced_items = []
    strategies_used = []

    for item in parsed_items:
        item_name = item.get("item_name", "")
        qty = item.get("qty", 1)

        # 1. Query MongoDB
        internal_data = inventory_collection.find_one({"item_name": {"$regex": item_name, "$options": "i"}})
        competitor_data = competitors_collection.find_one({"item_name": {"$regex": item_name, "$options": "i"}})

        base_cost = internal_data["base_cost"] if internal_data else 0.0
        comp_price = competitor_data["market_price"] if competitor_data else 0.0

        # 2. Let the AI Agent determine the strategy and price
        prompt = """
        You are a Pricing Strategy Agent.
        Item: {item_name}
        Our Base Cost: ₹{base_cost}
        Competitor Price: ₹{comp_price}
        
        Rules:
        1. If Competitor Price < Our Base Cost: Do not match the price. Suggest bundling a warranty or service.
        2. If Competitor Price > Our Base Cost: Suggest a price slightly lower than the competitor (e.g., 2% lower).
        3. If no competitor data: Suggest a standard 20% markup.
        
        Return ONLY a valid JSON object with keys "strategy" (string explaining rationale) and "quoted_unit_price" (number).
        """
        
        chain = PromptTemplate.from_template(prompt) | llm
        response = chain.invoke({"item_name": item_name, "base_cost": base_cost, "comp_price": comp_price})
        
        # Safely extract and parse AI response
        content_str = response.content[0]["text"] if isinstance(response.content, list) else response.content
        clean_json = content_str.strip().removeprefix("```json").removesuffix("```").strip()
        ai_decision = json.loads(clean_json)

        priced_items.append({
            "item_name": item_name,
            "qty": qty,
            "base_cost": base_cost,
            "competitor_price": comp_price,
            "quoted_unit_price": ai_decision["quoted_unit_price"],
            "total_price": ai_decision["quoted_unit_price"] * qty,
            "strategy": ai_decision["strategy"]
        })
        strategies_used.append(f"{item_name}: {ai_decision['strategy']}")

    return {
        "parsed_items": priced_items,
        "pricing_strategy": " | ".join(strategies_used)
    }

