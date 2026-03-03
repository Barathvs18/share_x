from fastapi import APIRouter, HTTPException, Depends
from models import UserSchema, UserLoginSchema
from database import user_collection
from utils.auth import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register")
async def register(user: UserSchema):
    # Basic email format check
    if "@" not in user.email or "." not in user.email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user_dict["password"])
    await user_collection.insert_one(user_dict)
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: UserLoginSchema):
    db_user = await user_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": db_user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user["email"],
            "username": db_user["username"]
        }
    }
