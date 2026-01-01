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

# Obtener URL de conexión MySQL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = os.getenv("MYSQL_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ Error: No se encontró DATABASE_URL ni MYSQL_URL.")

# REGLA DE ORO PARA RAILWAY + PYMYSQL:
# Railway da la URL como 'mysql://...', pero SQLAlchemy necesita 'mysql+pymysql://'
if SQLALCHEMY_DATABASE_URL.startswith("mysql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

# 2. Configurar Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()