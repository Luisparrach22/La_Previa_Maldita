from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal

# ============================================================================
# ENUMS
# ============================================================================
class UserRole(str, Enum):
    user = "user"
    admin = "admin"
    moderator = "moderator"
    vip = "vip"

class AuthProvider(str, Enum):
    email = "email"
    google = "google"
    facebook = "facebook"
    apple = "apple"

class ProductType(str, Enum):
    ticket = "ticket"
    merchandise = "merchandise"
    food = "food"
    drink = "drink"
    experience = "experience"
    bundle = "bundle"

class TicketType(str, Enum):
    general = "general"
    vip = "vip"
    premium = "premium"
    early_bird = "early_bird"
    group = "group"

class OrderStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    confirmed = "confirmed"
    paid = "paid"
    shipped = "shipped"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
    refunded = "refunded"

class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
    partial_refund = "partial_refund"

class TicketStatus(str, Enum):
    valid = "valid"
    used = "used"
    expired = "expired"
    cancelled = "cancelled"

class EventStatus(str, Enum):
    draft = "draft"
    published = "published"
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

class GoogleAuthRequest(BaseModel):
    """Schema para recibir el token de Google OAuth"""
    token: str

# ============================================================================
# USER SCHEMAS
# ============================================================================
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    phone: Optional[str] = Field(None, max_length=20)

class UserUpdate(BaseModel):
    """Esquema para actualización parcial de usuario"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    date_of_birth: Optional[date] = None
    # Dirección
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    # Preferencias
    receive_notifications: Optional[bool] = None
    receive_marketing: Optional[bool] = None
    preferred_language: Optional[str] = None
    # Solo admin puede cambiar
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class UserCreateAdmin(UserCreate):
    """Schema para creación de usuario por administrador"""
    role: UserRole = UserRole.user
    is_active: bool = True
    is_verified: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    auth_provider: str = "email"
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserDetailResponse(UserResponse):
    """Respuesta detallada con todos los campos (para admin o perfil propio)"""
    date_of_birth: Optional[date] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    receive_notifications: bool = True
    receive_marketing: bool = False
    preferred_language: str = "es"
    last_login_at: Optional[datetime] = None
    login_count: int = 0

    class Config:
        from_attributes = True

# ============================================================================
# EVENT SCHEMAS
# ============================================================================
class EventBase(BaseModel):
    name: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)

class EventCreate(EventBase):
    start_date: datetime
    end_date: Optional[datetime] = None
    doors_open_at: Optional[datetime] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    venue_city: Optional[str] = None
    venue_capacity: Optional[int] = None

class EventUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    status: Optional[EventStatus] = None
    is_featured: Optional[bool] = None
    is_public: Optional[bool] = None

class EventResponse(EventBase):
    id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    status: str = "draft"
    is_featured: bool = False
    cover_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# PRODUCT SCHEMAS
# ============================================================================
class ProductBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    type: ProductType
    category: Optional[str] = None

class ProductCreate(ProductBase):
    slug: Optional[str] = None
    short_description: Optional[str] = None
    original_price: Optional[float] = None
    stock: int = 100
    image_url: Optional[str] = None
    event_id: Optional[int] = None
    ticket_type: Optional[TicketType] = None
    max_per_order: int = 10
    is_active: bool = True
    is_featured: bool = False
    is_visible: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    type: Optional[ProductType] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_visible: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    slug: Optional[str] = None
    short_description: Optional[str] = None
    original_price: Optional[float] = None
    stock: int = 0
    image_url: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    event_id: Optional[int] = None
    ticket_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# SCORE SCHEMAS
# ============================================================================
class ScoreBase(BaseModel):
    points: int = Field(..., ge=0)

class ScoreCreate(ScoreBase):
    game_type: str = "ghost_hunt"
    level_reached: int = 1
    time_played_seconds: Optional[int] = None
    device_type: Optional[str] = None

class ScoreUpdate(BaseModel):
    points: Optional[int] = None

class ScoreResponse(ScoreBase):
    id: int
    user_id: int
    game_type: str = "ghost_hunt"
    level_reached: int = 1
    played_at: datetime

    class Config:
        from_attributes = True

class ScoreWithUser(ScoreResponse):
    """Puntuación con información del usuario (para leaderboard)"""
    player: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ============================================================================
# ORDER ITEM SCHEMAS
# ============================================================================
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    product_type: Optional[str] = None
    product_image_url: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    ticket_code: Optional[str] = None
    ticket_status: Optional[str] = None

    class Config:
        from_attributes = True

class OrderItemWithProduct(OrderItemResponse):
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

# ============================================================================
# ORDER SCHEMAS
# ============================================================================
class OrderBase(BaseModel):
    customer_notes: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    customer_notes: Optional[str] = None
    # Dirección de envío (opcional, solo para merchandise)
    shipping_address_line1: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_country: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    admin_notes: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: int
    customer_email: str
    customer_name: Optional[str] = None
    subtotal: float
    tax_amount: float = 0
    discount_amount: float = 0
    total: float
    status: str
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderWithItems(OrderResponse):
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderDetailResponse(OrderWithItems):
    """Respuesta detallada de orden (para admin)"""
    customer_phone: Optional[str] = None
    shipping_address_line1: Optional[str] = None
    shipping_city: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    customer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

# ============================================================================
# ADMIN DASHBOARD SCHEMAS
# ============================================================================
class DashboardStats(BaseModel):
    """Estadísticas para el panel de admin"""
    total_users: int
    total_orders: int
    total_revenue: float
    total_tickets_sold: int
    pending_orders: int
    new_users_today: int
    new_orders_today: int

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# FORWARD REFERENCES UPDATE
# ============================================================================
ScoreWithUser.model_rebuild()
OrderItemWithProduct.model_rebuild()
OrderWithItems.model_rebuild()