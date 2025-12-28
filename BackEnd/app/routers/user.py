from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from .. import schemas, crud, database, auth, dependencies, models
from ..email_utils import send_welcome_email

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "No encontrado"}},
)


# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user: schemas.UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """
    Registrar un nuevo usuario.
    
    - **username**: Nombre de usuario único
    - **email**: Email único del usuario
    - **password**: Contraseña del usuario
    
    Envía un correo de bienvenida automáticamente.
    """
    # Verificar si el email ya existe
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El email ya está registrado"
        )
    
    # Verificar si el nombre de usuario ya existe
    db_username = crud.get_user_by_username(db, username=user.username)
    if db_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El nombre de usuario ya está en uso"
        )

    new_user = crud.create_user(db=db, user=user)
    
    # Enviar correo de bienvenida en segundo plano
    background_tasks.add_task(send_welcome_email, email_to=new_user.email, username=new_user.username)
    
    return new_user


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """
    Iniciar sesión y obtener token de acceso.
    
    - **email**: Email del usuario
    - **password**: Contraseña del usuario
    """
    user = crud.get_user_by_email(db, email=form_data.email)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google-auth", response_model=schemas.Token)
def google_auth(google_data: schemas.GoogleAuthRequest, db: Session = Depends(database.get_db)):
    """
    Autenticar o registrar usuario mediante Google OAuth.
    
    - **token**: El JWT credential token proporcionado por Google Identity Services
    
    Si el usuario existe (por email), se autentica.
    Si no existe, se crea automáticamente con los datos de Google.
    """
    from google.oauth2 import id_token
    from google.auth.transport import requests
    import os
    
    try:
        # Verificar el token con Google
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
        
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google Client ID no configurado en el servidor"
            )
        
        idinfo = id_token.verify_oauth2_token(
            google_data.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Extraer datos del token verificado
        email = idinfo.get('email')
        full_name = idinfo.get('name', '')
        given_name = idinfo.get('given_name', '')  # Nombre
        family_name = idinfo.get('family_name', '')  # Apellido
        picture = idinfo.get('picture', '')  # Avatar/Foto
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo obtener el email de Google"
            )
        
        # Buscar si el usuario ya existe
        db_user = crud.get_user_by_email(db, email=email)
        
        if db_user:
            # Usuario existe - actualizar info de Google si está vacía
            if not db_user.first_name and given_name:
                db_user.first_name = given_name
            if not db_user.last_name and family_name:
                db_user.last_name = family_name
            if not db_user.avatar_url and picture:
                db_user.avatar_url = picture
            db.commit()
            db.refresh(db_user)
        else:
            # Crear nuevo usuario
            # Generar username único basado en el nombre
            base_username = full_name.replace(" ", "_").lower()[:20] if full_name else email.split('@')[0]
            username = base_username
            counter = 1
            while crud.get_user_by_username(db, username=username):
                username = f"{base_username}_{counter}"
                counter += 1
            
            # Crear usuario con password random (no lo usará, entra por Google)
            import secrets
            random_password = secrets.token_urlsafe(32)
            
            # Crear el usuario en la base de datos
            new_user_data = schemas.UserCreate(
                username=username,
                email=email,
                password=random_password,
                first_name=given_name or None,
                last_name=family_name or None
            )
            db_user = crud.create_user(db=db, user=new_user_data)
            
            # Actualizar campos adicionales que no están en UserCreate
            db_user.avatar_url = picture if picture else None
            db_user.auth_provider = "google"
            db.commit()
            db.refresh(db_user)
        
        # Generar nuestro JWT token
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": str(db_user.id)}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        # Token inválido
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Google inválido: {str(e)}"
        )


# ============================================================================
# AUTHENTICATED USER ENDPOINTS
# ============================================================================

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    """
    Obtener información del usuario actual autenticado.
    """
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_current_user(
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Actualizar información del usuario actual.
    Solo puede actualizar su propio perfil (no puede cambiar su rol).
    """
    # El usuario no puede cambiar su propio rol
    if user_update.role is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes cambiar tu propio rol"
        )
    
    # Verificar email único si se está actualizando
    if user_update.email:
        existing_user = crud.get_user_by_email(db, email=user_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso"
            )
    
    # Verificar username único si se está actualizando
    if user_update.username:
        existing_user = crud.get_user_by_username(db, username=user_update.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
    
    try:
        updated_user = crud.update_user(db, current_user.id, user_update)
        return updated_user
    except Exception as e:
        print(f"❌ Error actualizando usuario: {e}") # Log simple para debug
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al actualizar perfil: {str(e)}"
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Eliminar la cuenta del usuario actual.
    """
    crud.delete_user(db, current_user.id)
    return None


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreateAdmin, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Crear un nuevo usuario con permisos de administrador. **Solo administradores.**
    """
    # Verificar si el email ya existe
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El email ya está registrado"
        )
    
    # Verificar si el nombre de usuario ya existe
    db_username = crud.get_user_by_username(db, username=user.username)
    if db_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El nombre de usuario ya está en uso"
        )

    return crud.create_user_admin(db=db, user=user)


@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener lista de todos los usuarios. **Solo administradores.**
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@router.get("/count")
def get_users_count(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener el total de usuarios registrados. **Solo administradores.**
    """
    count = crud.get_users_count(db)
    return {"total": count}


@router.get("/total-points")
def get_total_points(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener la suma total de puntos (soul_balance) de todos los jugadores. **Solo administradores.**
    
    Este valor representa los "ingresos totales" del sistema basados en puntos.
    """
    from sqlalchemy import func
    
    # Sumar todos los soul_balance de todos los usuarios
    total_points = db.query(func.sum(models.User.soul_balance)).scalar() or 0
    
    return {"total_points": total_points}


@router.get("/recent", response_model=List[schemas.UserResponse])
def get_recent_users(
    limit: int = 5,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener los usuarios registrados más recientes. **Solo administradores.**
    """
    return crud.get_recent_users(db, limit=limit)


@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener información de un usuario específico por ID. **Solo administradores.**
    """
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuario no encontrado"
        )
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Actualizar información de un usuario. **Solo administradores.**
    """
    # Verificar que el usuario existe
    existing_user = crud.get_user(db, user_id)
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar email único si se está actualizando
    if user_update.email:
        email_user = crud.get_user_by_email(db, email=user_update.email)
        if email_user and email_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso"
            )
    
    # Verificar username único si se está actualizando
    if user_update.username:
        username_user = crud.get_user_by_username(db, username=user_update.username)
        if username_user and username_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
    
    updated_user = crud.update_user(db, user_id, user_update)
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Eliminar un usuario. **Solo administradores.**
    """
    # No permitir que el admin se elimine a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta desde aquí"
        )
    
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return None