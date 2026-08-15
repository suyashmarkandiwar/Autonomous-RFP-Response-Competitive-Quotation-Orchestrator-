from typing import TypedDict, List, Dict, Any

# ─────────────────────────────────────────────────────────────
# GRAPH 1 STATE — Used by analysis_app (Parser → Pricing)
# ─────────────────────────────────────────────────────────────
class AnalysisState(TypedDict):
    # ── Input (provided by /analyze API call) ─────────────────
    rfp_text: str

    # ── Agent 1 (Parser) writes, Agent 2 (Pricing) reads ──────
    parsed_items: List[Dict[str, Any]]
    # Each dict: { item_name, qty }

    # ── Agent 2 (Pricing) writes ──────────────────────────────
    pricing_data: List[Dict[str, Any]]
    # Each dict: { item_name, qty, base_cost, competitor_price,
    #              quoted_unit_price, total_price, strategy }


# ─────────────────────────────────────────────────────────────
# GRAPH 2 STATE — Used by generation_app (Drafter)
# ─────────────────────────────────────────────────────────────
class DrafterState(TypedDict):
    # ── Input (provided by /approve-and-generate API call) ────
    rfp_title: str
    client_name: str
    approved_items: List[Dict[str, Any]]
    # Each dict: { item_id, item_name, quantity, final_price }

    # ── Agent 3 (Drafter) writes ──────────────────────────────
    executive_summary: str
