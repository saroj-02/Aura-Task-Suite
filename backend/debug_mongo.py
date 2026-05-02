import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def debug_mongo():
    url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(url)
    
    print(f"Connecting to: {url.split('@')[-1]}") # Print cluster part only for safety
    
    # List all databases
    dbs = await client.list_database_names()
    print(f"Databases found: {dbs}")
    
    for db_name in dbs:
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"  - Database '{db_name}' has collections: {collections}")
        for coll_name in collections:
            count = await db[coll_name].count_documents({})
            print(f"    * Collection '{coll_name}' has {count} documents")

if __name__ == "__main__":
    asyncio.run(debug_mongo())
