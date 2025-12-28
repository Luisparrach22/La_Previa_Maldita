from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from . import models, schemas, auth
from fastapi import HTTPException, status

# ============================================================================
# USER CRUD
# ============================================================================

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Obtener usuario por ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Obtener usuario por email"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Obtener usuario por nombre de usuario"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Obtener lista de usuarios con paginación"""
    return db.query(models.User).offset(skip).limit(limit).all()

def get_recent_users(db: Session, limit: int = 5) -> List[models.User]:
    """Obtener usuarios recientes"""
    return db.query(models.User).order_by(desc(models.User.created_at)).limit(limit).all()

def get_users_count(db: Session) -> int:
    """Obtener el total de usuarios"""
    return db.query(models.User).count()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Crear nuevo usuario"""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone if hasattr(user, 'phone') else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_admin(db: Session, user: schemas.UserCreateAdmin) -> models.User:
    """Crear nuevo usuario (Admin)"""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone if hasattr(user, 'phone') else None,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Actualizar usuario existente"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Si se actualiza la contraseña, hashearla
    if "password" in update_data:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    """Eliminar usuario"""
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True


# ============================================================================
# PRODUCT CRUD
# ============================================================================

def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    """Obtener producto por ID"""
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100, include_inactive: bool = False) -> List[models.Product]:
    """Obtener lista de productos con paginación (solo activos por defecto)"""
    query = db.query(models.Product)
    if not include_inactive:
        query = query.filter(models.Product.is_active == True)
    return query.offset(skip).limit(limit).all()

def get_products_by_type(db: Session, product_type: str, skip: int = 0, limit: int = 100, include_inactive: bool = False) -> List[models.Product]:
    """Obtener productos filtrados por tipo (solo activos por defecto)"""
    query = db.query(models.Product).filter(models.Product.type == product_type)
    if not include_inactive:
        query = query.filter(models.Product.is_active == True)
    return query.offset(skip).limit(limit).all()

def get_products_count(db: Session, include_inactive: bool = False) -> int:
    """Obtener el total de productos"""
    query = db.query(models.Product)
    if not include_inactive:
        query = query.filter(models.Product.is_active == True)
    return query.count()

def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    """Crear nuevo producto"""
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate) -> Optional[models.Product]:
    """Actualizar producto existente"""
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product_stock(db: Session, product_id: int, quantity_change: int) -> Optional[models.Product]:
    """Actualizar stock del producto (incrementar o decrementar)"""
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    new_stock = db_product.stock + quantity_change
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente para el producto {db_product.name}"
        )
    
    db_product.stock = new_stock
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    """Eliminar producto"""
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    
    db.delete(db_product)
    db.commit()
    return True


# ============================================================================
# SCORE CRUD
# ============================================================================

def get_score(db: Session, score_id: int) -> Optional[models.Score]:
    """Obtener puntuación por ID"""
    return db.query(models.Score).filter(models.Score.id == score_id).first()

def get_scores(db: Session, skip: int = 0, limit: int = 100) -> List[models.Score]:
    """Obtener lista de puntuaciones con paginación"""
    return db.query(models.Score).order_by(desc(models.Score.points)).offset(skip).limit(limit).all()

def get_scores_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Score]:
    """Obtener puntuaciones de un usuario específico"""
    return db.query(models.Score).filter(
        models.Score.user_id == user_id
    ).order_by(desc(models.Score.points)).offset(skip).limit(limit).all()

def get_top_scores(db: Session, limit: int = 10) -> List[models.Score]:
    """Obtener las mejores puntuaciones (leaderboard)"""
    return db.query(models.Score).order_by(desc(models.Score.points)).limit(limit).all()

def get_user_best_score(db: Session, user_id: int) -> Optional[models.Score]:
    """Obtener la mejor puntuación de un usuario"""
    return db.query(models.Score).filter(
        models.Score.user_id == user_id
    ).order_by(desc(models.Score.points)).first()

def create_score(db: Session, score: schemas.ScoreCreate, user_id: int) -> models.Score:
    """Crear nueva puntuación"""
    db_score = models.Score(points=score.points, user_id=user_id)
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score

def update_score(db: Session, score_id: int, score_update: schemas.ScoreUpdate) -> Optional[models.Score]:
    """Actualizar puntuación existente"""
    db_score = get_score(db, score_id)
    if not db_score:
        return None
    
    update_data = score_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_score, field, value)
    
    db.commit()
    db.refresh(db_score)
    return db_score

def delete_score(db: Session, score_id: int) -> bool:
    """Eliminar puntuación"""
    db_score = get_score(db, score_id)
    if not db_score:
        return False
    
    db.delete(db_score)
    db.commit()
    return True


# ============================================================================
# ORDER CRUD
# ============================================================================

def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    """Obtener pedido por ID"""
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[models.Order]:
    """Obtener lista de pedidos con paginación"""
    return db.query(models.Order).order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()

def get_orders_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Order]:
    """Obtener pedidos de un usuario específico"""
    return db.query(models.Order).filter(
        models.Order.user_id == user_id
    ).order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()

def get_orders_by_status(db: Session, status: str, skip: int = 0, limit: int = 100) -> List[models.Order]:
    """Obtener pedidos por estado"""
    return db.query(models.Order).filter(
        models.Order.status == status
    ).order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()

def get_orders_count(db: Session) -> int:
    """Obtener el total de pedidos"""
    return db.query(models.Order).count()

def get_tickets_sold_count(db: Session) -> int:
    """Obtener el total de tickets vendidos"""
    # Contamos los items de orden que son tickets
    # Dado que los tickets se desglosan en items individuales de cantidad 1, un count es suficiente.
    # Si alguna vez cambiamos eso, deberíamos hacer sum(quantity).
    return db.query(models.OrderItem).filter(models.OrderItem.product_type == 'ticket').count()

def create_order(db: Session, order: schemas.OrderCreate, user_id: int) -> models.Order:
    """Crear nuevo pedido con sus items"""
    import uuid
    
    # Generar número de orden único (e.g., ORD-12345678)
    order_number = f"ORD-{str(uuid.uuid4()).upper()[:8]}"
    
    # Crear el pedido
    db_order = models.Order(
        user_id=user_id, 
        total=0.0,
        order_number=order_number,
        customer_email="user@email.com", # Placeholder, idealmente del usuario
        status="confirmed", # Confirmado porque se paga con almas al instante
        payment_status="paid"
    )
    # Intentar obtener email del usuario si es posible
    user = get_user(db, user_id)
    if user:
        db_order.customer_email = user.email
        db_order.customer_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        
    db.add(db_order)
    db.flush()
    
    total = 0.0
    
    # Crear los items del pedido
    for item in order.items:
        product = get_product(db, item.product_id)
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")
        
        if product.stock < item.quantity:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
            
        # Determinar si necesitamos desglosar items (para tickets)
        items_to_create = []
        if product.type == "ticket":
            # Crear un item por cada unidad para tener códigos únicos
            for _ in range(item.quantity):
                items_to_create.append({
                    "quantity": 1,
                    "is_ticket": True
                })
        else:
            # Item normal
            items_to_create.append({
                "quantity": item.quantity,
                "is_ticket": False
            })
            
        for new_item_data in items_to_create:
            qty = new_item_data["quantity"]
            item_total = float(product.price) * qty
            
            # Generar código si es ticket
            ticket_code = None
            ticket_status = None
            if new_item_data["is_ticket"]:
                ticket_code = f"TKT-{str(uuid.uuid4()).upper()[:8]}"
                ticket_status = "valid"
            
            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
                subtotal=item_total,
                product_name=product.name,
                product_type=product.type,
                product_image_url=product.image_url,
                ticket_code=ticket_code,
                ticket_status=ticket_status
            )
            db.add(db_item)
            total += item_total

        # Actualizar stock (una sola vez por el total de cantidad del producto original)
        product.stock -= item.quantity
    
    # Actualizar total del pedido
    db_order.total = total
    
    db.commit()
    db.refresh(db_order)
    return db_order

def update_order(db: Session, order_id: int, order_update: schemas.OrderUpdate) -> Optional[models.Order]:
    """Actualizar estado del pedido"""
    db_order = get_order(db, order_id)
    if not db_order:
        return None
    
    update_data = order_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_order, field, value)
    
    db.commit()
    db.refresh(db_order)
    return db_order

def cancel_order(db: Session, order_id: int) -> Optional[models.Order]:
    """Cancelar pedido y restaurar stock"""
    db_order = get_order(db, order_id)
    if not db_order:
        return None
    
    if db_order.status == "cancelled":
        return db_order  # Ya está cancelado
    
    # Restaurar stock de los productos
    for item in db_order.items:
        if item.product:
            item.product.stock += item.quantity
    
    db_order.status = "cancelled"
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int) -> bool:
    """Eliminar pedido"""
    db_order = get_order(db, order_id)
    if not db_order:
        return False
    
    # Restaurar stock si el pedido no estaba cancelado
    if db_order.status != "cancelled":
        for item in db_order.items:
            if item.product:
                item.product.stock += item.quantity
    
    db.delete(db_order)
    db.commit()
    return True


# ============================================================================
# ORDER ITEM CRUD
# ============================================================================

def get_order_item(db: Session, item_id: int) -> Optional[models.OrderItem]:
    """Obtener item de pedido por ID"""
    return db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()

def get_order_items(db: Session, order_id: int) -> List[models.OrderItem]:
    """Obtener todos los items de un pedido"""
    return db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()


# ============================================================================
# TICKET VALIDATION
# ============================================================================

def get_ticket_by_code(db: Session, ticket_code: str) -> Optional[models.OrderItem]:
    """Buscar un ticket por su código"""
    return db.query(models.OrderItem).filter(
        models.OrderItem.ticket_code == ticket_code
    ).first()

def mark_ticket_as_used(db: Session, ticket_code: str, admin_id: int) -> Optional[models.OrderItem]:
    """Marcar un ticket como usado"""
    from datetime import datetime
    
    ticket = get_ticket_by_code(db, ticket_code)
    if not ticket:
        return None
    
    if ticket.ticket_status == "used":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este ticket ya ha sido usado"
        )
    
    ticket.ticket_status = "used"
    ticket.ticket_used_at = datetime.utcnow()