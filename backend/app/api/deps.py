from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.db.session import get_db
from app.schemas.user import TokenPayload

import time
from typing import Dict, Tuple

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login"
)

# In-memory cache for user data to reduce DB lookups
# Format: {token_sub: (user_data, expiry_time)}
USER_CACHE: Dict[str, Tuple[Any, float]] = {}
CACHE_TTL = 10  # Seconds

async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_db), 
    token: str = Depends(reusable_oauth2)
) -> Any:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # Check cache first
    now = time.time()
    if token_data.sub in USER_CACHE:
        cached_user, expiry = USER_CACHE[token_data.sub]
        if now < expiry:
            return cached_user
            
    user = await db.users.find_one({
        "$or": [
            {"email": token_data.sub},
            {"id": token_data.sub}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["id"] = str(user["_id"])
    
    # Store in cache
    USER_CACHE[token_data.sub] = (user, now + CACHE_TTL)
    
    return user

async def get_current_active_user(
    current_user: Any = Depends(get_current_user),
) -> Any:
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin(
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user
