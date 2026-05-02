import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def check_users():
    url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(url)
    db = client[os.getenv("DATABASE_NAME")]
    
    users = await db.users.find().to_list(length=100)
    print("Users in MongoDB:")
    for u in users:
        print(f"- Email: {u['email']}, Role: {u.get('role')}, Name: {u.get('full_name')}")

if __name__ == "__main__":
    asyncio.run(check_users())
