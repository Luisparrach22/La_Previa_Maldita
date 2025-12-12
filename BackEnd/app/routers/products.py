from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products