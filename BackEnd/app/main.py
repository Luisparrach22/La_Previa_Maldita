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
    Base.metadata.create_all(bind=engine)
    
    from . import crud, schemas
    db = SessionLocal()
    try:
        products = crud.get_products(db, limit=1)
        if not products:
            print("--- Seeding Database ---")
            initial_products = [
                schemas.ProductCreate(name="Ticket Mortal", description="Acceso General", price=6.66, type="ticket", stock=200, image_url="ticket-mortal.png"),
                schemas.ProductCreate(name="Ticket Demonio", description="VIP + Sangre", price=13.13, type="ticket", stock=50, image_url="ticket-demonio.png"),
                schemas.ProductCreate(name="Máscara Macabra", description="Oculta tu miedo", price=20.00, type="item", stock=30, image_url="mask.png"),
                schemas.ProductCreate(name="Elixir de Vida", description="Bebida roja", price=5.00, type="item", stock=100, image_url="elixir.png"),
            ]
            for p in initial_products:
                crud.create_product(db, p)
            print("--- Seed Completed ---")
    finally:
        db.close()

# ... (Resto del archivo igual) ...