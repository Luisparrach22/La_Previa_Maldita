from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, database, dependencies, models

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
    responses={404: {"description": "No encontrado"}},
)


# ============================================================================
# AUTHENTICATED USER ENDPOINTS
# ============================================================================

@router.post("/", response_model=schemas.OrderWithItems, status_code=status.HTTP_201_CREATED)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Crear un nuevo pedido con los items especificados.
    
    El stock se descuenta automáticamente al crear el pedido.
    
    **Ejemplo de body:**
    ```json
    {
        "items": [
            {"product_id": 1, "quantity": 2},
            {"product_id": 3, "quantity": 1}
        ]
    }
    ```
    """
    if not order.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El pedido debe contener al menos un item"
        )
    
    return crud.create_order(db=db, order=order, user_id=current_user.id)


@router.get("/my-orders", response_model=List[schemas.OrderWithItems])
def get_my_orders(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Obtener los pedidos del usuario actual.
    
    - **status_filter**: Filtrar por estado (pending, confirmed, cancelled, completed)
    """
    orders = crud.get_orders_by_user(db=db, user_id=current_user.id, skip=skip, limit=limit)
    
    if status_filter:
        orders = [o for o in orders if o.status == status_filter]
    
    return orders


@router.get("/my-orders/{order_id}", response_model=schemas.OrderWithItems)
def get_my_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Obtener un pedido específico del usuario actual.
    """
    db_order = crud.get_order(db, order_id=order_id)
    
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    
    # Verificar que el pedido pertenece al usuario
    if db_order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este pedido"
        )
    
    return db_order


@router.post("/my-orders/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_my_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Cancelar un pedido propio.
    
    Solo se puede cancelar si está en estado 'pending'.
    El stock se restaura automáticamente.
    """
    db_order = crud.get_order(db, order_id=order_id)
    
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    
    # Verificar que el pedido pertenece al usuario
    if db_order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este pedido"
        )
    
    # Solo se puede cancelar si está pendiente
    if db_order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cancelar un pedido con estado '{db_order.status}'"
        )
    
    return crud.cancel_order(db, order_id)


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[schemas.OrderWithItems])
def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, description="Filtrar por estado"),
    user_id: Optional[int] = Query(None, description="Filtrar por ID de usuario"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener todos los pedidos. **Solo administradores.**
    
    - **status_filter**: Filtrar por estado
    - **user_id**: Filtrar por usuario
    """
    if status_filter:
        orders = crud.get_orders_by_status(db=db, status=status_filter, skip=skip, limit=limit)
    elif user_id:
        orders = crud.get_orders_by_user(db=db, user_id=user_id, skip=skip, limit=limit)
    else:
        orders = crud.get_orders(db=db, skip=skip, limit=limit)
    
    return orders


@router.get("/count")
def get_orders_count(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener el total de pedidos. **Solo administradores.**
    """
    count = crud.get_orders_count(db)
    return {"total": count}


@router.get("/{order_id}", response_model=schemas.OrderWithItems)
def get_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener un pedido específico por ID. **Solo administradores.**
    """
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    return db_order


@router.put("/{order_id}", response_model=schemas.OrderResponse)
def update_order(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Actualizar el estado de un pedido. **Solo administradores.**
    
    Estados válidos: pending, confirmed, cancelled, completed
    """
    db_order = crud.update_order(db, order_id, order_update)
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    return db_order


@router.post("/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Cancelar un pedido y restaurar el stock. **Solo administradores.**
    """
    db_order = crud.cancel_order(db, order_id)
    if db_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    return db_order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Eliminar un pedido. **Solo administradores.**
    
    El stock se restaura automáticamente si el pedido no estaba cancelado.
    """
    success = crud.delete_order(db, order_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    return None
