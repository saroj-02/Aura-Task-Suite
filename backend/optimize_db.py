from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

async def optimize_db():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL", "mongodb+srv://sarojpadhi28:IBqTzLV0d2TBTuDj@cluster0.n9zjrky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    database_name = os.getenv("DATABASE_NAME", "aura_task_suite")
    
    print(f"Starting Database Optimization for: {database_name}...")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    # 1. Users Collection Optimization
    print("Creating indexes for 'users'...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.users.create_index("role")
    
    # 2. Tasks Collection Optimization
    print("Creating indexes for 'tasks'...")
    await db.tasks.create_index([("owner_id", 1), ("created_at", -1)]) # Compound index for faster dashboard loading
    await db.tasks.create_index("status")
    await db.tasks.create_index("priority")
    await db.tasks.create_index("updated_at")
    
    print("All performance indexes created successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(optimize_db())
