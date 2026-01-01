from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

# 1. Cargar Variables de Entorno (solo si existe el archivo .env, útil para local)
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

# Obtener URL de conexión MySQL (la buscará primero en las variables de sistema de Railway)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Si no hay URL, intentamos construirla con otras variables comunes de Railway o fallamos
    print("⚠️ DATABASE_URL no encontrada, verificando alternativas...")
    SQLALCHEMY_DATABASE_URL = os.getenv("MYSQL_URL") # Otra común en Railway

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ Error Crítico: No se encontró DATABASE_URL ni MYSQL_URL en el entorno.")

# 2. Configurar Engine (MySQL no necesita check_same_thread)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()