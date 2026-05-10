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
        hp = u.get('hashed_password', 'N/A')
        hp_preview = hp[:10] + "..." if hp != 'N/A' else 'N/A'
        print(f"- Email: {u['email']}, Role: {u.get('role')}, Hashed Pass: {hp_preview}")

if __name__ == "__main__":
    asyncio.run(check_users())
