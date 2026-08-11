from pydantic import BaseModel
from typing import Optional

# Our Internal Inventory Model
class InventoryItem(BaseModel):
    item_name: str
    base_cost: float
    stock_available: int
    category: Optional[str] = "General"
    unit: Optional[str] = "Unit"
    specifications: Optional[str] = ""

# Competitor Pricing Model
class CompetitorPrice(BaseModel):
    item_name: str
    competitor_name: str
    market_price: float