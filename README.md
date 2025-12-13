# 🍷👻 La Previa Maldita

> **Come, bebe y grita.**
> Una experiencia web inmersiva full-stack para la gestión de eventos de terror y gastronomía.

![Estado del Proyecto](https://img.shields.io/badge/Estado-Beta-orange)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

## 📖 Descripción

**La Previa Maldita** ha evolucionado de una simple landing page a una aplicación web completa (**Full Stack**) diseñada para "Terror en el Campus". Combina una interfaz de usuario rica e interactiva con un backend robusto para la gestión de usuarios, productos, pedidos y puntuaciones.

El proyecto permite a los usuarios sumergirse en la atmósfera del evento, registrarse, comprar entradas y productos, y competir en minijuegos donde sus puntuaciones quedan registradas en la base de datos.

## ✨ Características Principales

### 🎟️ Tienda y Sistema de Ticketing
- **Productos Dinámicos:** Los items de la tienda y tickets se cargan directamente desde la base de datos a través de la API.
- **Carrito de Compras:** Lógica de carrito en el frontend con checkout real y persistencia de pedidos.
- **Tipos de Producto:** Tickets ("Mortal", "Demonio", "Fantasma") y Merchandise.

### 🔐 Autenticación y Usuarios (JWT)
- **Registro y Login Real:** Backend implementado con **FastAPI** y seguridad vía **JWT (JSON Web Tokens)**.
- **OAuth con Google:** Inicio de sesión con Google Identity Services.
- **Protección de Rutas:** Ciertas acciones requieren estar autenticado.
- **Persistencia:** Los usuarios se guardan en una base de datos **MySQL**.

### 👨‍💼 Panel de Administración
- **Dashboard:** Vista general con estadísticas en tiempo real.
- **Gestión de Usuarios:** CRUD completo (Crear, Leer, Actualizar, Eliminar usuarios).
- **Gestión de Productos:** Administración del catálogo de productos y tickets.
- **Gestión de Pedidos:** Seguimiento y actualización de estados de pedidos.
- **Validación de Tickets:** Sistema para validar y marcar tickets como usados.
- **Actualizaciones en Tiempo Real:** Polling automático para detectar nuevos pedidos.

### 🎮 Gamificación con Persistencia
- **Minijuego "Sobrevive":** Juego tipo *Whack-a-Ghost*.
- **High Scores:** Al terminar el juego, si el usuario está logueado, su puntuación se envía y guarda en el servidor.

### 🎨 UI/UX Inmersiva
- **Multimedia:** Reproducción de trailer oficial en modal flotante.
- **Chatbot "El Oráculo":** Asistente virtual con respuestas predefinidas para guiar al usuario.
- **Estética Horror:** Animaciones glitch, fuentes temáticas (*Creepster*, *Nosifer*) y diseño responsive.
- **Optimizaciones de Rendimiento:** Throttling de eventos, caching de DOM, y lazy loading.

## 🛠️ Tecnologías Utilizadas

### Frontend
| Tecnología | Uso |
|------------|-----|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) | Estructura semántica |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) | Estilos, animaciones y diseño responsive |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) | Lógica Cliente, Fetch API, DOM Manipulation |

### Backend
| Tecnología | Uso |
|------------|-----|
| ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) | Lenguaje Principal |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) | Framework de API REST |
| ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white) | ORM |
| ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white) | Base de Datos |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white) | Autenticación |

## 🚀 Instalación y Uso

### Prerrequisitos
- Python 3.9+
- MySQL Server (corriendo localmente o en contenedor)
- Navegador Web Moderno

### Método Rápido (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/La_Previa_Maldita.git
cd La_Previa_Maldita

# Ejecutar ambos servicios
./start_dev.sh
```

Esto iniciará:
- 📡 **Backend API:** http://localhost:8000
- 📚 **API Docs:** http://localhost:8000/docs
- 🌐 **Frontend:** http://localhost:5500
- 👤 **Admin Panel:** http://localhost:5500/admin.html

### Instalación Manual

#### 1. Configuración del Backend

```bash
cd La_Previa_Maldita/BackEnd

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt
```

Crea un archivo `.env` en `BackEnd/`:
```env
DATABASE_URL=mysql+pymysql://usuario:password@localhost:3306/la_previa_db
SECRET_KEY=tu_secreto_super_seguro
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=tu_google_client_id  # Opcional, para OAuth
```

Ejecuta el servidor:
```bash
uvicorn app.main:app --reload --port 8000
```

#### 2. Ejecución del Frontend

```bash
cd La_Previa_Maldita/FronteEnd
python -m http.server 5500
```

Abre http://localhost:5500 en tu navegador.

## 📂 Estructura del Proyecto

```text
La_Previa_Maldita/
├── BackEnd/                    # Servidor API (FastAPI)
│   ├── app/
│   │   ├── routers/            # Rutas de la API
│   │   │   ├── games.py        # Endpoints para juegos y puntuaciones
│   │   │   ├── orders.py       # Endpoints para pedidos y tickets
│   │   │   ├── products.py     # Endpoints para tienda
│   │   │   └── user.py         # Endpoints de usuarios (auth)
│   │   ├── auth.py             # Lógica de seguridad y hash de contraseñas
│   │   ├── crud.py             # Operaciones CRUD (DB)
│   │   ├── database.py         # Configuración de conexión a MySQL
│   │   ├── dependencies.py     # Dependencias (obtener usuario actual, admin)
│   │   ├── main.py             # Punto de entrada de la aplicación
│   │   ├── models.py           # Modelos SQLAlchemy (Tablas)
│   │   └── schemas.py          # Esquemas Pydantic (Validación)
│   ├── .env.example            # Plantilla de variables de entorno
│   ├── database_schema.sql     # Esquema SQL completo
│   └── requirements.txt        # Dependencias Python
│
├── FronteEnd/                  # Cliente Web
│   ├── Images/                 # Assets gráficos
│   ├── Videos/                 # Assets multimedia
│   ├── index.html              # Página principal
│   ├── admin.html              # Panel de administración
│   ├── user_page.html          # Página de perfil de usuario
│   ├── admin.js                # Lógica del panel admin
│   ├── script.js               # Lógica Frontend principal
│   ├── admin.css               # Estilos del panel admin
│   └── styles.css              # Estilos principales
│
├── start_dev.sh                # Script para iniciar desarrollo
├── .gitignore                  # Archivos ignorados por Git
└── README.md                   # Documentación
```

## 🔒 Archivos Sensibles (NO subir a Git)

El proyecto está configurado para ignorar automáticamente:

| Archivo/Carpeta | Razón |
|-----------------|-------|
| `.env` | Contiene credenciales de BD y claves secretas |
| `*.db` / `*.sqlite` | Archivos de base de datos local |
| `__pycache__/` | Archivos compilados de Python |
| `venv/` | Entorno virtual (instalar con requirements.txt) |
| `.DS_Store` | Archivos del sistema macOS |
| `node_modules/` | Dependencias de Node (si las hubiera) |

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**🎃 ¿Preparado para gritar?**