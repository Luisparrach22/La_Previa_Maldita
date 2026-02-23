# 🎃 La Previa Maldita

> **El evento de terror más escalofriante del año universitario.**

Bienvenido al repositorio oficial de **La Previa Maldita**, una plataforma web inmersiva para un evento de terror de Halloween en 2025. Los usuarios pueden explorar la información del evento, comprar tickets al inframundo, adquirir mercancía maldita en la tienda, y jugar a minijuegos terroríficos para conseguir recompensas (almas 👻).

---

## 📖 Sobre el Proyecto

**La Previa Maldita** no es solo una página informativa, sino una experiencia completa para los asistentes. Cuenta con un diseño escalofriante, animaciones interactivas, integración de autenticación (incluido Google Sign-In) y un sistema de tienda/carrito impulsado por un backend robusto.

El contexto del evento es una fiesta temática de terror que se llevará a cabo el 31 de Octubre de 2025 a la medianoche en una "Ubicación Secreta".

## ✨ Características Principales

- **Sistema de Autenticación:** Registro e inicio de sesión seguro usando credenciales estándar o Google Sign-In.
- **Venta de Tickets:** Obtén tu pase al inframundo directamente desde la plataforma.
- **Tienda Maldita:** Filtra y explora una tienda virtual con artículos de "merchandising", comida y bebidas malditas. Incluye sistema de carrito de compras real.
- **Juegos Mortales:** Mini-juegos inmersivos incrustados en la web:
  - 👻 _Whack-a-Ghost:_ Juego de reflejos y rapidez.
  - 🧠 _Trivia Maldita:_ Demuestra tus conocimientos sobre terror.
  - 🃏 _Memoria Letal:_ El clásico juego de memoria, pero con un toque terrorífico.
- **Chatbot (Oráculo Maldito):** Un asistente virtual dentro de la aplicación para guiar (o asustar) a las víctimas.
- **Panel de Usuario:** Cada usuario tiene su propio "Santuario" donde puede ver sus almas recolectadas, tickets adquiridos, mejores puntuaciones en los juegos y recompensas conseguidas.

## 🛠 Tecnologías y Stack

El proyecto sigue una arquitectura clásica Cliente-Servidor separada en dos carpetas principales (`Frontend` y `Backend`).

### 💻 Frontend

Construido completamente con tecnologías nativas web ("Vanilla"):

- **HTML5:** Semantic y estructurado para SEO.
- **CSS3:** Estilos avanzados, animaciones (`@keyframes`), diseño adaptable (Responsive Design) y Variables, sin depender de librerías externas.
- **JavaScript (ES6+):** Lógica modular, manejo del DOM, validación de formularios y consumo de APIs mediante `fetch`.
- **Google Identity Services:** Para la integración de autenticación de Google de manera moderna y segura.

### ⚙️ Backend

Desarrollado en Python, orientado al alto rendimiento y estructurado de forma moderna:

- **[FastAPI](https://fastapi.tiangolo.com/):** Framework moderno y rápido para construir APIs con Python 3.8+.
- **Uvicorn:** Servidor ASGI para FastAPI.
- **SQLAlchemy:** Auténtico ORM de Python para gestionar la base de datos de manera relacional.
- **PyMySQL:** Conector para la base de datos MySQL/MariaDB.
- **Autenticación (JWT & Argon2):** Sistema seguro de contraseñas usando `passlib` (con hashing Argon2) y tokens JWT con `python-jose`.
- **Pydantic:** Para la validación fuerte de datos en las peticiones y respuestas.

## 🚀 Instalación y Entorno de Desarrollo

### Requisitos Previos

- Servidor de base de datos MySQL o MariaDB.
- Python 3.9 o superior.
- Node.js o Live Server (opcional, para servir el Frontend).

### Instrucciones

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/Luisparrach22/La_Previa_Maldita.git
   cd La_Previa_Maldita
   ```

2. **Configurar la Base de Datos y Entorno (Backend)**
   - Navega a la carpeta `/Backend`.
   - Renombra el archivo `.env.example` a `.env` y configura las credenciales de tu base de datos MySQL, puerto, y claves secretas JWT.
   - Usar el script de configuración inicial (creará un entorno virtual e instalará dependencias):
     ```bash
     bash setup.sh
     ```

3. **Iniciar el Servidor de Desarrollo**
   - Tenemos scripts en el nivel raíz del proyecto para facilitar esto:
     ```bash
     # Inicia el servidor backend y todo lo necesario
     bash start_dev.sh
     ```
   - El Backend estará corriendo en `http://localhost:8000` (con documentación Swagger en `/docs`).
   - Puedes visualizar el frontend en tu navegador abriendo el archivo `Frontend/index.html` o usando un Live Server.

## 📂 Estructura Principal de Directorios

```text
La_Previa_Maldita/
│
├── Backend/                 # Toda la API en FastAPI
│   ├── app/                 # Lógica principal, modelos, routers y dependencias
│   ├── requirements.txt     # Dependencias de Python
│   └── .env                 # (No versionado) Configuración del servidor
│
├── Frontend/                # Archivos estáticos
│   ├── assets/              # CSS, Imágenes, JS, y Videos
│   │   ├── css/
│   │   ├── js/
│   │   └── ...
│   ├── pages/               # Páginas secundarias (e.g., user_page.html)
│   └── index.html           # Página principal / Landing Page
│
├── deploy_prod.sh           # Script de despliegue en Producción
├── start_dev.sh             # Script de arranque en entorno de Desarrollo
└── setup.sh                 # Script inicial para instalar el entorno
```

## 📜 Licencia

Desarrollado para la **La Previa Maldita 2025**. Todos los derechos de imágenes, concepto de marca y código fuente relacionados al proyecto se encuentran reservados.

---

_¿Sobrevivirás a la noche más oscura del año?_ 🦇
