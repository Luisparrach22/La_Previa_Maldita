from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relación con las puntuaciones de juegos
    scores = relationship("GameScore", back_populates="player")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(String(500), nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String(255), nullable=True) # Para la tienda de accesorios
    category = Column(String(50), nullable=True)   # ej: "disfraz", "bebida", "comida"
    is_available = Column(Boolean, default=True)

class GameScore(Base):
    __tablename__ = "game_scores"

    id = Column(Integer, primary_key=True, index=True)
    score = Column(Integer, nullable=False)
    game_name = Column(String(50), nullable=False) # ej: "MiniJuegoTerror"
    played_at = Column(DateTime, default=datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    
    player = relationship("User", back_populates="scores")
