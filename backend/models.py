from pydantic import BaseModel
from typing import Optional

class UserSchema(BaseModel):
    username: str
    email: str
    password: str

class UserLoginSchema(BaseModel):
    email: str
    password: str

class ShareSchema(BaseModel):
    file_id: str
    shared_with_email: str
    expiry_time: int  # Unix timestamp (seconds)

class RevokeSchema(BaseModel):
    file_id: str
    revoked_user_email: str

class VerifySchema(BaseModel):
    file_id: str
