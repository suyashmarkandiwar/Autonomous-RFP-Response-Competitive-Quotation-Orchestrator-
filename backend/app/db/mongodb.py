from pymongo import MongoClient
from app.config import settings

# Connect to local MongoDB
client = MongoClient(settings.MONGODB_URI)
db = client[settings.DATABASE_NAME]

# Initialize the 3 collections
inventory_collection = db["inventory"]
competitors_collection = db["competitors"]
rfp_quotes_collection = db["rfp_quotes"]