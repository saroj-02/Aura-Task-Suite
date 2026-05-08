from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

async def setup_indexes():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL", "mongodb+srv://sarojpadhi28:IBqTzLV0d2TBTuDj@cluster0.n9zjrky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    database_name = os.getenv("DATABASE_NAME", "aura_task_suite")
    
    print(f"Connecting to MongoDB: {database_name}...")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    print("Creating indexes for 'users' collection...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    
    print("Creating indexes for 'tasks' collection...")
    await db.tasks.create_index("owner_id")
    await db.tasks.create_index("created_at")
    
    print("All indexes created successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_indexes())
