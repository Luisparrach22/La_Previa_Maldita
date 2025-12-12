from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, database, dependencies

router = APIRouter(
    prefix="/products",
    tags=["products"],
)

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(database.get_db),
    # Descomenta la siguiente línea si quieres proteger la creación de productos solo para usuarios logueados
    # current_user: schemas.User = Depends(dependencies.get_current_user) 
):
    return crud.create_product(db=db, product=product)