from sqlalchemy.orm import Session
from . import models, schemas, auth

# --- USUARIOS ---
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username, 
        email=user.email, 
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- PRODUCTOS ---
def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

# --- JUEGO (SCORES) ---
def create_score(db: Session, score: schemas.ScoreCreate, user_id: int):
    db_score = models.Score(**score.dict(), user_id=user_id)
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score

def get_top_scores(db: Session, limit: int = 10):
    return db.query(models.Score).order_by(models.Score.points.desc()).limit(limit).all()