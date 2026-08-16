import os
import pymongo
from dotenv import load_dotenv

# Load environment variables (mostly for the target MONGODB_URI)
load_dotenv()

# Source and target connections
LOCAL_URI = "mongodb://localhost:27017/"
TARGET_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DATABASE_NAME", "sme_quotation_db")

print(f"Connecting to local MongoDB: {LOCAL_URI}")
local_client = pymongo.MongoClient(LOCAL_URI)
local_db = local_client[DB_NAME]

print(f"Connecting to target MongoDB: {TARGET_URI}")
target_client = pymongo.MongoClient(TARGET_URI)
target_db = target_client[DB_NAME]

collections = local_db.list_collection_names()
print(f"Found collections to migrate: {collections}")

for coll_name in collections:
    local_collection = local_db[coll_name]
    target_collection = target_db[coll_name]
    
    docs = list(local_collection.find({}))
    if not docs:
        print(f"Collection '{coll_name}' is empty, skipping.")
        continue
        
    print(f"Migrating {len(docs)} documents for collection '{coll_name}'...")
    
    # We clear the target collection first to avoid duplicate key errors if run multiple times
    target_collection.delete_many({})
    
    # Insert documents
    target_collection.insert_many(docs)
    print(f"Successfully migrated '{coll_name}'.")

print("\nMigration completed successfully!")
