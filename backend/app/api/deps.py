from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.db.session import get_db
from app.schemas.user import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login"
)

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
    
    # MongoDB uses _id. If sub is email or string ID, we find it.
    # In my implementation, I'll store 'id' as a field or use the email as unique identifier.
    user = await db.users.find_one({"email": token_data.sub})
    if not user:
        # Try finding by string ID if sub was an ID
        user = await db.users.find_one({"id": token_data.sub})
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert _id to string for consistency if needed, but here we return the dict
    user["id"] = str(user["_id"])
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
