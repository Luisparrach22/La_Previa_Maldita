from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy.exc import SQLAlchemyError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .database import engine, Base, SessionLocal
from .routers import user, products, games, orders, upload
import os

# ... (Previous code) ... (It's better to just do the import change and the include change)

# Note: The tool requires me to provide context. I will use a larger block or target precise lines.

# Let's target the imports first



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
# RATE LIMITING
# ============================================================================
# Limita las peticiones globales a 100 por minuto por IP para evitar ataques
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
# ============================================================================
# CORS MIDDLEWARE
# ============================================================================
from .config import settings

# En desarrollo permitimos localhost en varios puertos
# En producción se debe configurar la variable ALLOWED_ORIGINS
origins_raw = settings.ALLOWED_ORIGINS
origins = [origin.strip() for origin in origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler para asegurar que los errores también tengan headers CORS
from fastapi.exceptions import HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure CORS headers are present even in error responses"""
    origin = request.headers.get("origin")
    headers = {}
    
    if origin and origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Oculta mensajes de error de la BD al frontend en producción"""
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        
    print(f"Database error: {exc}") # Registro interno del error
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno en la base de datos."},
        headers=headers
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
app.include_router(upload.router)


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
def seed_database():
    """
    Seed inicial de la base de datos con productos de ejemplo.
    Solo se ejecuta si no hay productos existentes.
    """
    from . import crud, schemas
    
    db = SessionLocal()
    try:
        # Verificar si ya hay productos
        existing_products = crud.get_products(db, limit=1)
        if existing_products:
            print("📦 Base de datos ya contiene productos, saltando seed...")
            return
        
        print("🌱 Iniciando seed de base de datos...")
        
        # Productos iniciales
        initial_products = [
            schemas.ProductCreate(
                name="Ticket Mortal",
                description="Acceso General al evento. Incluye una bebida de bienvenida.",
                price=6.66,
                type="ticket",
                stock=200,
                image_url="ticket-mortal.png"
            ),
            schemas.ProductCreate(
                name="Ticket Demonio",
                description="Acceso VIP con barra libre de sangría y zona preferente.",
                price=13.13,
                type="ticket",
                stock=50,
                image_url="ticket-demonio.png"
            ),
            schemas.ProductCreate(
                name="Ticket Fantasma",
                description="Entrada doble para traer a tu acompañante del más allá.",
                price=10.00,
                type="ticket",
                stock=100,
                image_url="ticket-fantasma.png"
            ),
            schemas.ProductCreate(
                name="Máscara Macabra",
                description="Oculta tu rostro con esta terrorífica máscara artesanal.",
                price=20.00,
                type="merchandise",
                stock=30,
                image_url="mask.png"
            ),
            schemas.ProductCreate(
                name="Elixir de Vida",
                description="Bebida energética roja con un toque misterioso.",
                price=5.00,
                type="drink",
                stock=100,
                image_url="elixir.png"
            ),
            schemas.ProductCreate(
                name="Capa de Vampiro",
                description="Capa negra con forro rojo satinado. Talla única.",
                price=35.00,
                type="merchandise",
                stock=25,
                image_url="cape.png"
            ),
            schemas.ProductCreate(
                name="Set de Maquillaje Zombie",
                description="Kit completo para transformarte en un no-muerto.",
                price=15.00,
                type="merchandise",
                stock=40,
                image_url="makeup.png"
            ),
            schemas.ProductCreate(
                name="Sangre Falsa Premium",
                description="Sangre artificial de alta calidad, lavable y no tóxica.",
                price=8.00,
                type="merchandise",
                stock=60,
                image_url="blood.png"
            ),
        ]
        
        for product in initial_products:
            crud.create_product(db, product)
        
        print(f"✅ Seed completado: {len(initial_products)} productos creados")
        
    except Exception as e:
        print(f"❌ Error durante el seed: {e}")
    finally:
        db.close()