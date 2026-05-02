import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

async def update_to_ist():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME")]
    
    tasks = await db.tasks.find().to_list(length=1000)
    print(f"Updating {len(tasks)} tasks to IST...")
    
    for task in tasks:
        updates = {}
        for field in ["created_at", "updated_at"]:
            val = task.get(field)
            if val:
                if isinstance(val, str):
                    try:
                        # Try parsing common ISO formats
                        dt = datetime.fromisoformat(val.replace('Z', '+00:00'))
                        updates[field] = dt + timedelta(hours=5, minutes=30)
                    except:
                        print(f"Could not parse string date: {val}")
                elif isinstance(val, datetime):
                    updates[field] = val + timedelta(hours=5, minutes=30)
            
        if updates:
            await db.tasks.update_one({"_id": task["_id"]}, {"$set": updates})
            
    print("All tasks updated to IST!")

if __name__ == "__main__":
    asyncio.run(update_to_ist())
