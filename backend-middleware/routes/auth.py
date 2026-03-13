from fastapi import APIRouter, HTTPException, status, Depends
from models.user import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from config.database import get_db
from datetime import datetime
from bson import ObjectId
from typing import List
from pydantic import BaseModel

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    db = get_db()
    
    # Check if user exists
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user.dict()
    user_dict["password"] = hash_password(user_dict["password"])
    user_dict["created_at"] = datetime.utcnow()
    
    result = db.users.insert_one(user_dict)
    created_user = db.users.find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    
    return created_user

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db = get_db()
    
    # Find user
    db_user = db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create token
    access_token = create_access_token(
        data={"sub": str(db_user["_id"]), "email": db_user["email"], "role": db_user["role"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return user

class PreferencesUpdate(BaseModel):
    preferred_genres: List[str]

@router.put("/preferences", response_model=UserResponse)
async def update_preferences(prefs: PreferencesUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"preferred_genres": prefs.preferred_genres}}
    )
    user = db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user