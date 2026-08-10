from app.db.mongodb import inventory_collection, competitors_collection

# 1. Prepare the data
inventory_data = [
    {"item_name": "Enterprise Laptop", "base_cost": 45000.0, "stock_available": 150},
    {"item_name": "Database Server", "base_cost": 120000.0, "stock_available": 20},
    {"item_name": "Cloud Storage 1TB", "base_cost": 4000.0, "stock_available": 999}
]

competitor_data = [
    {"item_name": "Enterprise Laptop", "competitor_name": "TechNova", "market_price": 48000.0},
    {"item_name": "Database Server", "competitor_name": "TechNova", "market_price": 115000.0},
    {"item_name": "Cloud Storage 1TB", "competitor_name": "CloudCorp", "market_price": 4500.0}
]

# 2. Clear old data and insert new data
inventory_collection.delete_many({})
competitors_collection.delete_many({})

inventory_collection.insert_many(inventory_data)
competitors_collection.insert_many(competitor_data)

print("Data seeded! Open MongoDB Compass to view your collections.")