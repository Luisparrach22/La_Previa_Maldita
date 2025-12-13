from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUMS
# ============================================================================
class UserRole(str, Enum):
    user = "user"
    admin = "admin"

class ProductType(str, Enum):
    ticket = "ticket"
    item = "item"

class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"

# ============================================================================
# TOKEN SCHEMAS
# ============================================================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# ============================================================================
# USER SCHEMAS
# ============================================================================
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    """Esquema para actualización parcial de usuario"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserWithScores(UserResponse):
    """Usuario con sus puntuaciones incluidas"""
    scores: List["ScoreResponse"] = []

    class Config:
        from_attributes = True

# ============================================================================
# PRODUCT SCHEMAS
# ============================================================================
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    type: ProductType
    stock: int = 100
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    """Esquema para actualización parcial de producto"""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    type: Optional[ProductType] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

# ============================================================================
# SCORE SCHEMAS
# ============================================================================
class ScoreBase(BaseModel):
    points: int

class ScoreCreate(ScoreBase):
    pass

class ScoreUpdate(BaseModel):
    """Esquema para actualización de puntuación"""
    points: Optional[int] = None

class ScoreResponse(ScoreBase):
    id: int
    user_id: int
    played_at: datetime

    class Config:
        from_attributes = True

class ScoreWithUser(ScoreResponse):
    """Puntuación con información del usuario"""
    player: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ============================================================================
# ORDER ITEM SCHEMAS
# ============================================================================
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    unit_price: float

class OrderItemCreate(BaseModel):
    """Para crear un item en el pedido, solo necesitamos producto y cantidad"""
    product_id: int
    quantity: int = 1

class OrderItemResponse(OrderItemBase):
    id: int

    class Config:
        from_attributes = True

class OrderItemWithProduct(OrderItemResponse):
    """Item de pedido con información del producto"""
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

# ============================================================================
# ORDER SCHEMAS
# ============================================================================
class OrderBase(BaseModel):
    status: OrderStatus = OrderStatus.pending

class OrderCreate(BaseModel):
    """Para crear un pedido, solo necesitamos los items"""
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    """Esquema para actualización de pedido"""
    status: Optional[OrderStatus] = None

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderWithItems(OrderResponse):
    """Pedido con items incluidos"""
    items: List[OrderItemWithProduct] = []

    class Config:
        from_attributes = True

# ============================================================================
# FORWARD REFERENCES UPDATE
# ============================================================================
UserWithScores.model_rebuild()
ScoreWithUser.model_rebuild()
OrderItemWithProduct.model_rebuild()
OrderWithItems.model_rebuild()