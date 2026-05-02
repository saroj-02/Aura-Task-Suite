import sqlite3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

async def migrate():
    # 1. Connect to SQLite
    sqlite_conn = sqlite3.connect("aura.db")
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()

    # 2. Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    print("Starting migration...")

    # 3. Migrate Users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    user_id_map = {} # {old_id: new_id}

    for user in users:
        user_dict = dict(user)
        old_id = user_dict.pop('id')
        
        # Check if user already exists in MongoDB
        existing_user = await db.users.find_one({"email": user_dict["email"]})
        if not existing_user:
            result = await db.users.insert_one(user_dict)
            new_id = str(result.inserted_id)
            print(f"Migrated User: {user_dict['email']}")
        else:
            new_id = str(existing_user["_id"])
            print(f"User already exists: {user_dict['email']}")
        
        user_id_map[old_id] = new_id

    # 4. Migrate Tasks
    cursor.execute("SELECT * FROM tasks")
    tasks = cursor.fetchall()

    for task in tasks:
        task_dict = dict(task)
        old_id = task_dict.pop('id')
        old_owner_id = task_dict.pop('owner_id')
        
        # Map owner_id
        task_dict['owner_id'] = user_id_map.get(old_owner_id)
        
        if not task_dict['owner_id']:
            print(f"Skipping task {old_id}: Owner not found")
            continue

        # Avoid duplicates if possible (here we just insert)
        await db.tasks.insert_one(task_dict)
        print(f"Migrated Task: {task_dict['title']}")

    print("Migration complete!")
    sqlite_conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
