from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. Cargar Variables de Entorno desde .env
# Esto lee el archivo .env en la raíz del proyecto para obtener la URL
load_dotenv() 

# Obtener la URL de conexión que definiste en el .env
# Formato: mysql+pymysql://usuario:password@host:port/nombre_base_datos
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("La variable de entorno 'DATABASE_URL' no está definida. Revisa tu archivo .env")

# 2. Configurar la conexión a la base de datos
# El 'engine' es el punto de inicio para hablar con la base de datos.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

# El 'SessionLocal' es la clase de sesión de base de datos. 
# Cada instancia de SessionLocal será una sesión de base de datos.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La clase Base se utiliza para crear los modelos de base de datos (ORM).
Base = declarative_base()

# 3. Dependencia para la Gestión de Sesiones (Middleware)
# Esta función es un 'generator' que FastAPI usa como dependencia (Depends)
# para inyectar una sesión de base de datos en tus rutas, asegurando que se 
# cierre la conexión al finalizar la petición.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()