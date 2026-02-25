from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid
from .. import schemas, crud, database, dependencies, models

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    responses={404: {"description": "No encontrado"}},
)

@router.post("/upload/", response_model=dict)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Subir una imagen de producto. Retorna la URL relativa.
    """
    UPLOAD_DIR = "app/static/uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    base_url = str(request.base_url).rstrip('/')
    return {"url": f"{base_url}/static/uploads/{unique_filename}"}

# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(
    skip: int = Query(0, ge=0, description="Número de productos a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de productos a retornar"),
    product_type: Optional[str] = Query(None, description="Filtrar por tipo: 'ticket' o 'item'"),
    db: Session = Depends(database.get_db)
):
    """
    Obtener lista de productos.
    
    - **skip**: Número de productos a saltar (paginación)
    - **limit**: Número máximo de productos a retornar
    - **product_type**: Filtrar por tipo de producto ('ticket' o 'item')
    """
    if product_type:
        products = crud.get_products_by_type(db, product_type=product_type, skip=skip, limit=limit)
    else:
        products = crud.get_products(db, skip=skip, limit=limit)
    return products


@router.get("/tickets", response_model=List[schemas.ProductResponse])
def read_tickets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """
    Obtener todos los tickets disponibles.
    """
    return crud.get_products_by_type(db, product_type="ticket", skip=skip, limit=limit)


@router.get("/items", response_model=List[schemas.ProductResponse])
def read_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """
    Obtener todos los items de la tienda (no tickets).
    """
    return crud.get_products_by_type(db, product_type="item", skip=skip, limit=limit)


@router.get("/count")
def get_products_count(db: Session = Depends(database.get_db)):
    """
    Obtener el total de productos disponibles.
    """
    count = crud.get_products_count(db)
    return {"total": count}


# ============================================================================
# ADMIN ENDPOINTS - CRUD COMPLETO
# ============================================================================

@router.get("/admin/all", response_model=List[schemas.ProductResponse])
def read_all_products_admin(
    skip: int = Query(0, ge=0, description="Número de productos a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de productos a retornar"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener TODOS los productos (incluyendo inactivos). **Solo administradores.**
    
    Este endpoint es para el panel de administración.
    """
    return crud.get_products(db, skip=skip, limit=limit, include_inactive=True)

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(database.get_db)):
    """
    Obtener información de un producto específico por ID.
    """
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Producto no encontrado"
        )
    return db_product

@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Crear un nuevo producto. **Solo administradores.**
    
    - **name**: Nombre del producto
    - **description**: Descripción del producto
    - **price**: Precio del producto
    - **type**: Tipo de producto ('ticket' o 'item')
    - **stock**: Cantidad disponible
    - **image_url**: URL de la imagen del producto
    """
    return crud.create_product(db=db, product=product)


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Actualizar un producto existente. **Solo administradores.**
    """
    db_product = crud.update_product(db, product_id, product_update)
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return db_product


@router.patch("/{product_id}/stock", response_model=schemas.ProductResponse)
def update_product_stock(
    product_id: int,
    quantity_change: int = Query(..., description="Cantidad a añadir (positivo) o quitar (negativo)"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Actualizar el stock de un producto. **Solo administradores.**
    
    - **quantity_change**: Número positivo para añadir stock, negativo para quitar
    """
    db_product = crud.update_product_stock(db, product_id, quantity_change)
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Eliminar un producto. **Solo administradores.**
    """
    success = crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return None