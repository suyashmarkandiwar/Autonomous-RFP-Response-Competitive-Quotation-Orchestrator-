from pydantic import BaseModel

# Our Internal Inventory Model
class InventoryItem(BaseModel):
    item_name: str
    base_cost: float
    stock_available: int

# Competitor Pricing Model
class CompetitorPrice(BaseModel):
    item_name: str
    competitor_name: str
    market_price: float