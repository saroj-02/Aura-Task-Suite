from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(
    settings.MONGODB_URL, 
    serverSelectionTimeoutMS=2000,  # fail fast if DB unreachable
    minPoolSize=2,
    maxPoolSize=50,
    waitQueueTimeoutMS=2000,
    heartbeatFrequencyMS=10000,
    retryWrites=True,
    retryReads=True,
    connectTimeoutMS=5000,
    socketTimeoutMS=30000
)
db = client[settings.DATABASE_NAME]

async def get_db():
    # We use a single client instance for efficiency
    try:
        yield db
    except Exception as e:
        print(f"Database error: {e}")
        raise
