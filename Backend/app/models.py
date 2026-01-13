from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean, Enum, JSON, Date, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum

# ============================================================================
# ENUMS
# ============================================================================
class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"
    moderator = "moderator"
    vip = "vip"

class AuthProvider(str, enum.Enum):
    email = "email"
    google = "google"
    facebook = "facebook"
    apple = "apple"

class EventStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    cancelled = "cancelled"
    completed = "completed"

class ProductType(str, enum.Enum):
    ticket = "ticket"
    merchandise = "merchandise"
    food = "food"
    drink = "drink"
    experience = "experience"
    bundle = "bundle"

class TicketType(str, enum.Enum):
    general = "general"
    vip = "vip"
    premium = "premium"
    early_bird = "early_bird"
    group = "group"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    confirmed = "confirmed"
    paid = "paid"
    shipped = "shipped"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
    refunded = "refunded"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
    partial_refund = "partial_refund"

class TicketStatus(str, enum.Enum):
    valid = "valid"
    used = "used"
    expired = "expired"
    cancelled = "cancelled"


# ============================================================================
# USER MODEL
# ============================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # Información de cuenta
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Información personal
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    
    # Dirección
    address_line1 = Column(String(200), nullable=True)
    address_line2 = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(50), default="España")
    
    # Control de acceso
    role = Column(String(20), default="user")
    auth_provider = Column(String(20), default="email")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    
    # Economía (Gamificación)
    soul_balance = Column(Integer, default=0)
    
    # Preferencias
    receive_notifications = Column(Boolean, default=True)
    receive_marketing = Column(Boolean, default=False)
    preferred_language = Column(String(5), default="es")
    
    # Auditoría
    last_login_at = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    scores = relationship("Score", back_populates="player", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    created_events = relationship("Event", back_populates="creator")
    
    # Propiedad computada para nombre completo
    @property
    def full_name(self):
        parts = [self.first_name, self.last_name]
        return " ".join(p for p in parts if p) or self.username


# ============================================================================
# EVENT MODEL
# ============================================================================
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    
    # Fechas
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    doors_open_at = Column(DateTime, nullable=True)
    
    # Ubicación
    venue_name = Column(String(200), nullable=True)
    venue_address = Column(String(300), nullable=True)
    venue_city = Column(String(100), nullable=True)
    venue_capacity = Column(Integer, nullable=True)
    map_url = Column(String(500), nullable=True)
    
    # Media
    cover_image_url = Column(String(500), nullable=True)
    banner_image_url = Column(String(500), nullable=True)
    trailer_video_url = Column(String(500), nullable=True)
    
    # Estado
    status = Column(String(20), default="draft")
    is_featured = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    max_tickets_per_user = Column(Integer, default=5)
    
    # Auditoría
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    creator = relationship("User", back_populates="created_events")
    products = relationship("Product", back_populates="event")
    scores = relationship("Score", back_populates="event")


# ============================================================================
# PRODUCT MODEL
# ============================================================================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    
    # Información básica
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, nullable=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(300), nullable=True)
    
    # Categorización
    type = Column(String(50), nullable=False)
    category = Column(String(50), nullable=True)
    
    # Precios
    price = Column(DECIMAL(10, 2), nullable=False)
    original_price = Column(DECIMAL(10, 2), nullable=True)
    cost = Column(DECIMAL(10, 2), nullable=True)
    currency = Column(String(3), default="EUR")
    
    # Inventario
    stock = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)
    
    # Media
    image_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    gallery_urls = Column(JSON, nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    
    # Relación con evento
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    
    # Configuración de tickets
    ticket_type = Column(String(20), nullable=True)
    max_per_order = Column(Integer, default=10)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    event = relationship("Event", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


# ============================================================================
# ORDER MODEL
# ============================================================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    
    # Referencia pública
    order_number = Column(String(20), unique=True, nullable=False)
    
    # Usuario
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Datos del comprador
    customer_email = Column(String(100), nullable=False)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    
    # Dirección de envío
    shipping_address_line1 = Column(String(200), nullable=True)
    shipping_address_line2 = Column(String(200), nullable=True)
    shipping_city = Column(String(100), nullable=True)
    shipping_state = Column(String(100), nullable=True)
    shipping_postal_code = Column(String(20), nullable=True)
    shipping_country = Column(String(50), nullable=True)
    
    # Totales
    subtotal = Column(DECIMAL(10, 2), default=0.00)
    tax_amount = Column(DECIMAL(10, 2), default=0.00)
    discount_amount = Column(DECIMAL(10, 2), default=0.00)
    shipping_cost = Column(DECIMAL(10, 2), default=0.00)
    total = Column(DECIMAL(10, 2), default=0.00)
    currency = Column(String(3), default="EUR")
    
    # Cupones
    coupon_code = Column(String(50), nullable=True)
    coupon_discount = Column(DECIMAL(10, 2), default=0.00)
    
    # Estado
    status = Column(String(20), default="pending")
    payment_status = Column(String(20), default="pending")
    
    # Pago
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Notas
    customer_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Auditoría
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relaciones
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


# ============================================================================
# ORDER ITEM MODEL
# ============================================================================
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    # Datos del producto (copiados)
    product_name = Column(String(150), nullable=False)
    product_type = Column(String(50), nullable=True)
    product_image_url = Column(String(500), nullable=True)
    
    # Cantidades
    quantity = Column(Integer, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    
    # Datos de ticket
    ticket_code = Column(String(50), unique=True, nullable=True)
    ticket_qr_url = Column(String(500), nullable=True)
    ticket_status = Column(String(20), default="valid")
    ticket_used_at = Column(DateTime, nullable=True)
    ticket_checked_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    checker = relationship("User", foreign_keys=[ticket_checked_by])


# ============================================================================
# SCORE MODEL
# ============================================================================
class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    
    # Datos del juego
    game_type = Column(String(50), default="ghost_hunt")
    points = Column(Integer, nullable=False, default=0)
    level_reached = Column(Integer, default=1)
    time_played_seconds = Column(Integer, nullable=True)
    
    # Metadatos
    device_type = Column(String(50), nullable=True)
    played_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    player = relationship("User", back_populates="scores")
    event = relationship("Event", back_populates="scores")


# ============================================================================
# AUDIT LOG MODEL
# ============================================================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("User")