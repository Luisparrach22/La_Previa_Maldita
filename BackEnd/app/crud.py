from sqlalchemy.orm import Session
from . import models, schemas, auth

# --- User CRUD ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Product CRUD ---
def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Game Score CRUD ---
def create_game_score(db: Session, score: schemas.GameScoreCreate, user_id: int):
    db_score = models.GameScore(**score.dict(), user_id=user_id)
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score

def get_high_scores(db: Session, game_name: str, limit: int = 10):
    return db.query(models.GameScore)\
             .filter(models.GameScore.game_name == game_name)\
             .order_by(models.GameScore.score.desc())\
             .limit(limit)\
             .all()