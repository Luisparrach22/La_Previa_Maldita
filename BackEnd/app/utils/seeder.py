from .. import crud, schemas
from ..database import SessionLocal

def seed_database():
    """
    Seed inicial de la base de datos con productos de ejemplo.
    Solo se ejecuta si no hay productos existentes.
    """
    
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
                type="item",
                stock=30,
                image_url="mask.png"
            ),
            schemas.ProductCreate(
                name="Elixir de Vida",
                description="Bebida energética roja con un toque misterioso.",
                price=5.00,
                type="item",
                stock=100,
                image_url="elixir.png"
            ),
            schemas.ProductCreate(
                name="Capa de Vampiro",
                description="Capa negra con forro rojo satinado. Talla única.",
                price=35.00,
                type="item",
                stock=25,
                image_url="cape.png"
            ),
            schemas.ProductCreate(
                name="Set de Maquillaje Zombie",
                description="Kit completo para transformarte en un no-muerto.",
                price=15.00,
                type="item",
                stock=40,
                image_url="makeup.png"
            ),
            schemas.ProductCreate(
                name="Sangre Falsa Premium",
                description="Sangre artificial de alta calidad, lavable y no tóxica.",
                price=8.00,
                type="item",
                stock=60,
                image_url="blood.png"
            ),
        ]
        
        for product in initial_products:
            crud.create_product(db=db, product=product)
            
        print("✅ Seed completado exitosamente con items de terror.")
        
    except Exception as e:
        print(f"❌ Error durante el seed: {e}")
    finally:
        db.close()
