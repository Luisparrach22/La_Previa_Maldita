from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .database import engine, Base, SessionLocal
from .routers import user, products, games, orders
import os


# ============================================================================
# LIFESPAN - STARTUP/SHUTDOWN EVENTS
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.
    - Startup: Crea las tablas y hace seed de la base de datos
    - Shutdown: Limpieza si es necesaria
    """
    # --- STARTUP ---
    print("🚀 Iniciando La Previa Maldita API...")
    
    # Crear todas las tablas en la base de datos
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas de base de datos verificadas/creadas")
    
    # Seed inicial de datos
    seed_database()
    
    print("🎃 API lista para recibir solicitudes!")
    
    yield  # La aplicación se ejecuta aquí
    
    # --- SHUTDOWN ---
    print("👋 Cerrando La Previa Maldita API...")


# ============================================================================
# APP CONFIGURATION
# ============================================================================
app = FastAPI(
    title="La Previa Maldita API",
    description="""
    ## 🎃 API del Evento de Terror

    Esta API proporciona servicios para:
    
    * **👤 Usuarios**: Registro, autenticación y gestión de usuarios
    * **🎫 Productos**: Tickets y artículos de la tienda
    * **🎮 Juegos**: Sistema de puntuaciones y leaderboard
    * **🛒 Pedidos**: Carrito de compras y gestión de pedidos
    
    ### Autenticación
    La API utiliza **JWT Bearer tokens**. Para acceder a endpoints protegidos:
    1. Registra un usuario en `/users/register`
    2. Obtén un token en `/users/login`
    3. Incluye el token en el header: `Authorization: Bearer <token>`
    """,
    version="2.0.0",
    contact={
        "name": "La Previa Maldita",
        "email": "contacto@lapreviamaldita.com",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)


# ============================================================================
# CORS MIDDLEWARE
# ============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
static_path = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_path):
    os.makedirs(static_path)
    
app.mount("/static", StaticFiles(directory=static_path), name="static")


# ============================================================================
# ROUTERS
# ============================================================================
app.include_router(user.router)
app.include_router(products.router)
app.include_router(games.router)
app.include_router(orders.router)


# ============================================================================
# ROOT ENDPOINT
# ============================================================================
@app.get("/", tags=["Root"])
def read_root():
    """
    Endpoint raíz - Información de la API.
    """
    return {
        "name": "La Previa Maldita API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check - Verificar que la API está funcionando.
    """
    return {"status": "healthy", "message": "🎃 La Previa Maldita está viva!"}


# ============================================================================
# DATABASE SEED
# ============================================================================
from .utils.seeder import seed_database