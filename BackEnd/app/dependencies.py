from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from . import database, models, schemas, auth

# ============================================================================
# OAuth2 CONFIGURATION
# ============================================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

# ============================================================================
# DEPENDENCY: GET CURRENT USER
# ============================================================================
def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(database.get_db)
) -> models.User:
    """
    Dependency para obtener el usuario actual a partir del token JWT.
    Lanza HTTPException 401 si el token es inválido o el usuario no existe.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_identifier: str = payload.get("sub")
        if user_identifier is None:
            raise credentials_exception
        # No usamos TokenData schema estricto aquí para permitir flexibilidad
    except JWTError:
        raise credentials_exception
    
    user = None
    
    # 1. Intentar buscar por ID (si es numérico) - Estrategia robusta
    if user_identifier.isdigit():
        user = db.query(models.User).filter(models.User.id == int(user_identifier)).first()
        
    # 2. Si no se encontró o no es ID, buscar por username (compatibilidad tokens antiguos)
    if not user:
        user = db.query(models.User).filter(models.User.username == user_identifier).first()
    
    if user is None:
        raise credentials_exception
    
    return user


# ============================================================================
# DEPENDENCY: GET CURRENT ACTIVE USER
# ============================================================================
def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Dependency para verificar que el usuario actual está activo.
    En el futuro se podría añadir un campo 'is_active' al modelo User.
    """
    # Si se añade campo is_active al modelo:
    # if not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user


# ============================================================================
# DEPENDENCY: GET CURRENT ADMIN USER
# ============================================================================
def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Dependency para verificar que el usuario actual es administrador.
    Lanza HTTPException 403 si el usuario no tiene rol de admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para realizar esta acción"
        )
    return current_user


# ============================================================================
# OPTIONAL: GET CURRENT USER (Optional Auth)
# ============================================================================
def get_optional_current_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="users/login", auto_error=False)),
    db: Session = Depends(database.get_db)
) -> models.User | None:
    """
    Dependency opcional para obtener el usuario actual.
    Retorna None si no hay token o si es inválido (no lanza excepciones).
    Útil para endpoints que funcionan diferente si el usuario está autenticado.
    """
    if token is None:
        return None
    
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = db.query(models.User).filter(
        models.User.username == username
    ).first()
    
    return user