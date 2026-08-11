import re
import json
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from app.agents.state import AnalysisState
from app.db.mongodb import inventory_collection, competitors_collection
from app.config import settings

# Initialize the Pricing Agent LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY)


def _map_strategy_to_enum(rationale: str) -> str:
    """
    Maps the AI's free-text rationale to a valid StrategyEnum value.
    Falls back to 'Match Market Avg' if no keyword matches.
    """
    rationale_lower = rationale.lower()
    if any(kw in rationale_lower for kw in ["undercut", "lower than", "below competitor"]):
        return "Undercut (-5%)"
    if any(kw in rationale_lower for kw in ["bundle", "value", "warranty", "package"]):
        return "Value-Bundle (+8%)"
    if any(kw in rationale_lower for kw in ["margin", "markup", "premium"]):
        return "Margin-Maximizer"
    if any(kw in rationale_lower for kw in ["penetrat", "aggressive", "capture market"]):
        return "Market-Penetration"
    return "Match Market Avg"


def _make_item_id(item_name: str, index: int) -> str:
    """Generates a clean item ID from the item name."""
    slug = re.sub(r"[^a-zA-Z0-9]", "-", item_name).upper()[:12].strip("-")
    return f"{slug}-{index+1:02d}"


def pricing_node(state: AnalysisState):
    parsed_items = state.get("parsed_items", [])

    # These two lists are the outputs — matching ParsedItem and PricingData Pydantic shapes
    enriched_parsed_items = []
    pricing_data = []

    for i, item in enumerate(parsed_items):
        item_name = item.get("item_name", "")
        qty = item.get("qty", 1)
        item_id = _make_item_id(item_name, i)

        # Extract base product name — strip spec details in parentheses
        # e.g. "Enterprise Laptop (16GB RAM, 512GB SSD)" → "Enterprise Laptop"
        # This ensures DB rows stored as short names still match
        base_item_name = item_name.split("(")[0].strip()
        safe_base_name = re.escape(base_item_name)

        # ── 1. Query MongoDB for internal cost and competitor data ──────────
        # Partial match (no ^ and $) so "Enterprise Laptop" matches all DB variants
        internal_data = inventory_collection.find_one(
            {"item_name": {"$regex": safe_base_name, "$options": "i"}}
        )
        competitor_data = competitors_collection.find(
            {"item_name": {"$regex": safe_base_name, "$options": "i"}}
        )


        base_cost = internal_data.get("base_cost", 0.0) if internal_data else 0.0

        # Convert cursor to list and extract all prices
        all_competitors    = list(competitor_data)
        all_comp_prices    = [doc["market_price"] for doc in all_competitors if "market_price" in doc]

        # Representative price sent to AI (avg across all competitors, or 0 if none)
        comp_price = round(sum(all_comp_prices) / len(all_comp_prices), 2) if all_comp_prices else 0.0

        # Pull richer fields from inventory if available
        category       = internal_data.get("category", "General")       if internal_data else "General"
        unit           = internal_data.get("unit", "Unit")               if internal_data else "Unit"
        specifications = internal_data.get("specifications", "")         if internal_data else ""

        # ── 2. AI Pricing Agent ─────────────────────────────────────────────
        prompt = """
        You are a B2B Pricing Strategy Agent.
        Item: {item_name}
        Our Internal Base Cost: {base_cost}
        Competitor Market Price: {comp_price}

        Rules:
        1. If Competitor Price < Our Base Cost: Do not match. Suggest bundling (warranty/service).
        2. If Competitor Price > Our Base Cost: Price 2-5% below competitor to win the deal.
        3. If no competitor data (comp_price is 0): Apply a standard 20% markup on base cost.

        Return ONLY a valid JSON object with exactly two keys:
        - "rationale": a 1-2 sentence string explaining the strategy decision.
        - "quoted_unit_price": a number (the final recommended unit price).
        """

        chain = PromptTemplate.from_template(prompt) | llm
        response = chain.invoke({
            "item_name": item_name,
            "base_cost": base_cost,
            "comp_price": comp_price
        })

        content_str = (
            response.content[0]["text"]
            if isinstance(response.content, list)
            else response.content
        )
        clean_json   = content_str.strip().removeprefix("```json").removesuffix("```").strip()
        try:
            ai_decision = json.loads(clean_json)
        except json.JSONDecodeError:
            print(f"JSON parsing failed. Raw output: {clean_json}")
            ai_decision = {}  # Fallback to empty dict to trigger default values below

        rationale         = ai_decision.get("rationale", "AI pricing applied.")
        quoted_unit_price = float(ai_decision.get("quoted_unit_price", base_cost * 1.2))

        # ── 3. Derived calculations ─────────────────────────────────────────
        margin_pct   = round((quoted_unit_price - base_cost) / quoted_unit_price * 100, 1) \
                       if quoted_unit_price > 0 else 0.0
        total_profit = round((quoted_unit_price - base_cost) * qty, 2)

        # Build competitor range from all real competitor prices in MongoDB
        if all_comp_prices:
            comp_min     = round(min(all_comp_prices), 2)
            comp_max     = round(max(all_comp_prices), 2)
            comp_avg     = round(sum(all_comp_prices) / len(all_comp_prices), 2)
            comp_sources = len(all_comp_prices)
        else:
            comp_min = comp_max = comp_avg = 0.0
            comp_sources = 0

        # ── 4. Build ParsedItem-shaped dict ────────────────────────────────
        enriched_parsed_items.append({
            "item_id":        item_id,
            "category":       category,
            "item_name":      item_name,
            "quantity":       qty,
            "unit":           unit,
            "specifications": specifications,
        })

        # ── 5. Build PricingData-shaped dict ───────────────────────────────
        pricing_data.append({
            "item_id":               item_id,
            "internal_cost":         base_cost,
            "competitor_avg":        comp_avg,
            "competitor_range_min":  comp_min,
            "competitor_range_max":  comp_max,
            "competitor_sources":    comp_sources,
            "competitor_details":    [],           # Expanded by a future Competitor Research Agent
            "selected_strategy":     _map_strategy_to_enum(rationale),
            "available_strategies":  [
                "Undercut (-5%)", "Match Market Avg",
                "Value-Bundle (+8%)", "Margin-Maximizer", "Market-Penetration"
            ],
            "ai_rationale":          rationale,
            "human_price_override":  quoted_unit_price,
            "margin_percentage":     margin_pct,
            "total_profit":          total_profit,
        })

    

    return {
        "parsed_items": enriched_parsed_items,   # Matches ParsedItem Pydantic model
        "pricing_data": pricing_data,            # Matches PricingData Pydantic model
    }
