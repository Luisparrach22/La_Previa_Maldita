from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- PRODUCTOS ---
class ProductBase(BaseModel):
    name: str
    price: float
    type: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    stock: int

    class Config:
        orm_mode = True

# --- USUARIOS ---
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- JUEGO (SCORES) ---
class ScoreCreate(BaseModel):
    points: int

class ScoreResponse(BaseModel):
    id: int
    points: int
    played_at: datetime
    username: str # Para mostrar quién hizo el puntaje

    class Config:
        orm_mode = True

# --- TOKENS (LOGIN) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None