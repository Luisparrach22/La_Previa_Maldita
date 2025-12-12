from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import user, products, games

app = FastAPI(
    title="La Previa Maldita API",
    description="API para el evento de terror, juegos y tienda.",
    version="1.0.0"
)

# --- Configuración CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(user.router)
app.include_router(products.router)
app.include_router(games.router)

# --- Inicialización de Base de Datos y Seed ---
@app.on_event("startup")
def startup_event():
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    
    # Seed de Productos Iniciales
    from . import crud, schemas
    from sqlalchemy.orm import Session
    
    # Crear una nueva sesión manualmente para el seed
    db = SessionLocal()
    try:
        products = crud.get_products(db, limit=1)
        if not products:
            print("--- Seeding Database with Initial Products ---")
            initial_products = [
                schemas.ProductCreate(name="Máscara Macabra", description="Oculta tu miedo.", price=20.00, image_url="🎭", category="accesorio"),
                schemas.ProductCreate(name="Elixir de Vida", description="Recupera sanidad.", price=5.00, image_url="🍷", category="bebida"),
                schemas.ProductCreate(name="Hueso de Santo", description="Amuleto protector.", price=15.00, image_url="🦴", category="reliquia"),
                schemas.ProductCreate(name="Vela Negra", description="Ilumina la oscuridad.", price=8.00, image_url="🕯️", category="accesorio"),
            ]
            for p in initial_products:
                crud.create_product(db, p)
            print("--- Seed Completed ---")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API de La Previa Maldita! El terror te espera..."}
