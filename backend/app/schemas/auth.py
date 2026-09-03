from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: dict

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = "Control Center Operator"
    role: Optional[str] = "operator"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    full_name: str

    class Config:
        from_attributes = True
