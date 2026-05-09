from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.schemas.user import UserCreate, Token, User as UserSchema

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register(
    *,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_in: UserCreate
) -> Any:
    user = await db.users.find_one({"email": user_in.email})
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
    
    if user_in.role == "admin" and user_in.admin_key != settings.ADMIN_KEY:
        raise HTTPException(
            status_code=400,
            detail="Invalid Admin Key. You are not authorized to register as an admin.",
        )
    
    user_dict = {
        "email": user_in.email,
        "hashed_password": security.get_password_hash(user_in.password),
        "full_name": user_in.full_name,
        "role": user_in.role,
        "is_active": True
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

@router.post("/login", response_model=Token)
@router.post("/login/", response_model=Token, include_in_schema=False)
async def login(
    db: AsyncIOMotorDatabase = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = await db.users.find_one({"email": form_data.username})
    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user["email"], expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserSchema)
async def get_me(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    return current_user

@router.get("/users", response_model=list[UserSchema])
async def get_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: Any = Depends(deps.get_current_admin),
) -> Any:
    collection = db.get_collection("users")
    cursor = collection.find()
    users = await cursor.to_list(length=100)
    print(f"DEBUG: Found {len(users)} users in MongoDB")
    for user in users:
        user["id"] = str(user["_id"])
    return users
