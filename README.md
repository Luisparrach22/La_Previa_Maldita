# 🍷👻 La Previa Maldita

> **Come, bebe y grita.**
> Una experiencia web inmersiva full-stack para la gestión de eventos de terror y gastronomía.

![Estado del Proyecto](https://img.shields.io/badge/Estado-Beta-orange)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

## 📖 Descripción

**La Previa Maldita** ha evolucionado de una simple landing page a una aplicación web completa (**Full Stack**) diseñada para "Terror en el Campus". Combina una interfaz de usuario rica e interactiva con un backend robusto para la gestión de usuarios, productos y puntuaciones.

El proyecto permite a los usuarios sumergirse en la atmósfera del evento, registrarse, comprar entradas y productos (simulado con persistencia de stock futura), y competir en minijuegos donde sus puntuaciones quedan registradas en la base de datos.

## ✨ Características Principales

### 🎟️ Tienda y Sistema de Ticketing
- **Productos Dinámicos:** Los items de la tienda y tickets se cargan directamente desde la base de datos a través de la API.
- **Carrito de Compras:** Lógica de carrito en el frontend que permite añadir productos y simular el checkout ("Pagar con tu Alma").
- **Tipos de Producto:** Tickets ("Mortal", "Demonio") y Merch ("Máscara Macabra", "Elixir").

### 🔐 Autenticación y Usuarios (JWT)
- **Registro y Login Real:** Backend implementado con **FastAPI** y seguridad vía **JWT (JSON Web Tokens)**.
- **Protección de Rutas:** Ciertas acciones (como guardar puntajes o checkout final) requieren estar autenticado.
- **Persistencia:** Los usuarios se guardan en una base de datos **MySQL**.

### 🎮 Gamificación con Persistencia
- **Minijuego "Sobrevive":** Juego tipo *Whack-a-Ghost*.
- **High Scores:** Al terminar el juego, si el usuario está logueado, su puntuación se envía y guarda en el servidor.

### 🎨 UI/UX Inmersiva
- **Multimedia:** Reproducción de trailer oficial en modal flotante.
- **Chatbot "El Oráculo":** Asistente virtual con respuestas predefinidas para guiar al usuario.
- **Estética Horror:** Animaciones glitch, fuentes temáticas (*Creepster*) y diseño responsive.

## 🛠️ Tecnologías Utilizadas

### Frontend
* ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) **Estructura**
* ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) **Estilos y Animaciones**
* ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) **Lógica Cliente, Fetch API**

### Backend
* ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) **Lenguaje Principal**
* ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) **Framework de API**
* ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white) **ORM**
* ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white) **Base de Datos**

## 🚀 Instalación y Uso

Sigue estos pasos para levantar todo el entorno (Backend + Frontend).

### Prerrequisitos
- Python 3.9+
- MySQL Server (corriendo localmente o en contenedor)
- Navegador Web Moderno

### 1. Configuración del Backend

Navega a la carpeta del servidor:
```bash
cd La_Previa_Maldita/BackEnd
```

Crea un entorno virtual e instala las dependencias:
```bash
python -m venv venv
# En Windows: venv\Scripts\activate
# En Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Configura tu base de datos:
Asegúrate de tener un servidor MySQL corriendo y crea un archivo `.env` en la carpeta `BackEnd/` con la cadena de conexión (ajusta usuario/pass):
```env
DATABASE_URL=mysql+pymysql://usuario:password@localhost:3306/la_previa_db
SECRET_KEY=tu_secreto_super_seguro
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Ejecuta el servidor:
```bash
uvicorn app.main:app --reload
```
*El servidor iniciará en `http://localhost:8000`. La primera vez, creará las tablas y datos semilla automáticamente.*

### 2. Ejecución del Frontend

Simplemente abre el archivo `FronteEnd/index.html` en tu navegador.
Para una mejor experiencia (y evitar problemas de CORS o rutas relativas estrictas), usa una extensión como **Live Server** en VS Code.

## 📂 Estructura del Proyecto

```text
La_Previa_Maldita/
├── BackEnd/                  # Servidor API (FastAPI)
│   ├── app/
│   │   ├── routers/          # Rutas de la API
│   │   │   ├── games.py      # Endpoints para juegos y puntuaciones
│   │   │   ├── products.py   # Endpoints para tienda
│   │   │   └── user.py       # Endpoints de usuarios (auth)
│   │   ├── auth.py           # Lógica de seguridad y hash de contraseñas
│   │   ├── crud.py           # Operaciones Create, Read, Update, Delete (DB)
│   │   ├── database.py       # Configuración de conexión a MySQL
│   │   ├── dependencies.py   # Dependencias (e.g., obtener usuario actual)
│   │   ├── main.py           # Punto de entrada de la aplicación
│   │   ├── models.py         # Modelos SQLAlchemy (Tablas)
│   │   └── schemas.py        # Esquemas Pydantic (Validación de datos)
│   ├── .env                  # Variables de entorno (DB_URL, SECRET_KEY)
│   └── requirements.txt      # Lista de librerías Python necesarias
│
├── FronteEnd/                # Cliente Web
│   ├── Images/               # Assets gráficos
│   ├── Videos/               # Assets multimedia (Trailers)
│   ├── index.html            # Página principal (Single Page App)
│   ├── script.js             # Lógica Frontend (DOM, Fetch API, Juegos)
│   └── styles.css            # Estilos, animaciones y diseño responsive
│
└── README.md                 # Documentación del proyecto
```