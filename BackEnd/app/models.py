from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# ============================================================================
# USER MODEL
# ============================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # 'user' o 'admin'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    scores = relationship("Score", back_populates="player", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


# ============================================================================
# PRODUCT MODEL
# ============================================================================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # 'ticket' o 'item'
    stock = Column(Integer, default=100)
    image_url = Column(String(255), nullable=True)

    # Relaciones
    order_items = relationship("OrderItem", back_populates="product")


# ============================================================================
# SCORE MODEL
# ============================================================================
class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    points = Column(Integer, nullable=False)
    played_at = Column(DateTime, default=datetime.utcnow)

    # Relación
    player = relationship("User", back_populates="scores")


# ============================================================================
# ORDER MODEL
# ============================================================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    total = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), default="pending")  # pending, confirmed, cancelled, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


# ============================================================================
# ORDER ITEM MODEL
# ============================================================================
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)

    # Relaciones
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")