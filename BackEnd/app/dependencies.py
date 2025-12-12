from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from . import database, models, schemas, auth

# Esquema de seguridad: le dice a FastAPI dónde buscar el token (en /login)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Esta es la función mágica que protege tus rutas
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificamos el token
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # Buscamos al usuario en la BD
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user