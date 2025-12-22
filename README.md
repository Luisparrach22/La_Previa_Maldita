# 🎃 La Previa Maldita

<div align="center">
  
  ![Estado del Proyecto](https://img.shields.io/badge/Estado-Producción-success?style=for-the-badge)
  ![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)
  ![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
  ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

**Come, bebe y grita.**  
 _Plataforma web full-stack para la gestión de eventos de terror con sistema de gamificación._

[Demo en Vivo](#) • [Documentación](#) • [Reporte de Bugs](https://github.com/Luisparrach22/La_Previa_Maldita/issues)

</div>

---

## 📖 Descripción

**La Previa Maldita** es una aplicación web completa diseñada para "Terror en el Campus", que combina una experiencia de usuario inmersiva con un sistema robusto de backend. Los usuarios pueden:

- 🎟️ Comprar entradas y productos con **"Almas"** (moneda virtual)
- 🎮 Jugar minijuegos para ganar puntos
- 👤 Gestionar su perfil y pedidos
- 👨‍💼 (Admin) Administrar usuarios, productos y validar tickets

---

## ✨ Características

### 🛒 Sistema de Comercio

- **Tienda Dinámica**: Productos cargados desde base de datos
- **Economía de Almas**: Sistema de puntos integrado
- **Compras en Tiempo Real**: Sincronización instantánea con el admin

### 🎮 Gamificación

- **3 Minijuegos Mortales**:
  - 🔨 **Caza-Espectros**: Estilo Whack-a-Mole
  - 🧠 **Trivia Terror**: Preguntas de cine de horror
  - 🃏 **Memoria Letal**: Encuentra las parejas
- **Sistema de Puntuación**: Los puntos se convierten en Almas

### 🔐 Autenticación Segura

- JWT (JSON Web Tokens)
- OAuth con Google
- Roles de usuario (User/Admin/VIP)

### 👨‍💼 Panel de Administración

- Dashboard con estadísticas en tiempo real
- CRUD completo de usuarios, productos y pedidos
- Validación de tickets con código QR
- Carga de imágenes desde dispositivo

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Python 3.9+** ([Descargar](https://www.python.org/downloads/))
- **MySQL 8.0+** ([Descargar](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Descargar](https://git-scm.com/downloads))

### Instalación en 3 Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Luisparrach22/La_Previa_Maldita.git
cd La_Previa_Maldita

# 2. Ejecutar configuración automática
./setup.sh

# 3. Iniciar la aplicación
./start_dev.sh
```

**¡Listo!** La aplicación estará disponible en:

- 🌐 **Frontend**: http://localhost:5500
- 📡 **API**: http://localhost:8000
- 📚 **Documentación API**: http://localhost:8000/docs
- 👨‍💼 **Panel Admin**: http://localhost:5500/pages/admin.html

### Configuración de Base de Datos

Después de ejecutar `./setup.sh`, edita el archivo `BackEnd/.env`:

```env
DATABASE_URL=mysql+pymysql://TU_USUARIO:TU_CONTRASEÑA@localhost:3306/la_previa_db
SECRET_KEY=generada_automaticamente
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Luego crea la base de datos:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS la_previa_db;"
```

---

## 🏗️ Estructura del Proyecto

```
La_Previa_Maldita/
├── 📁 BackEnd/                 # API REST (FastAPI)
│   ├── 📁 app/
│   │   ├── 📁 routers/         # Endpoints
│   │   │   ├── games.py        # Sistema de juegos
│   │   │   ├── orders.py       # Pedidos y tickets
│   │   │   ├── products.py     # Tienda y catálogo
│   │   │   └── user.py         # Autenticación
│   │   ├── 📁 static/uploads/  # Imágenes de productos
│   │   ├── auth.py             # Seguridad y JWT
│   │   ├── crud.py             # Operaciones de BD
│   │   ├── database.py         # Conexión MySQL
│   │   ├── dependencies.py     # Middlewares
│   │   ├── main.py             # ⚙️  Servidor principal
│   │   ├── models.py           # Modelos SQLAlchemy
│   │   └── schemas.py          # Validación Pydantic
│   ├── .env.example            # Plantilla de configuración
│   └── requirements.txt        # Dependencias Python
│
├── 📁 FronteEnd/               # Cliente Web
│   ├── 📁 assets/
│   │   ├── 📁 css/             # Estilos temáticos
│   │   ├── 📁 js/              # Lógica de cliente
│   │   ├── 📁 images/          # Assets gráficos
│   │   └── 📁 videos/          # Multimedia
│   ├── 📁 pages/
│   │   ├── admin.html          # Panel de administración
│   │   └── user_page.html      # Dashboard de usuario
│   └── index.html              # 🏠 Página principal
│
├── 📄 setup.sh                 # Configuración automática
├── 📄 start_dev.sh             # Iniciar aplicación
├── 📄 stop.sh                  # Detener servidores
└── 📄 README.md                # Esta documentación
```

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología     | Versión | Propósito                |
| -------------- | ------- | ------------------------ |
| **Python**     | 3.9+    | Lenguaje principal       |
| **FastAPI**    | 0.104+  | Framework web asíncrono  |
| **SQLAlchemy** | 2.0+    | ORM para base de datos   |
| **MySQL**      | 8.0+    | Sistema de gestión de BD |
| **Pydantic**   | 2.0+    | Validación de datos      |
| **JWT**        | -       | Autenticación segura     |
| **Uvicorn**    | -       | Servidor ASGI            |

### Frontend

| Tecnología            | Propósito                       |
| --------------------- | ------------------------------- |
| **HTML5**             | Estructura semántica            |
| **CSS3**              | Diseño responsive y animaciones |
| **JavaScript (ES6+)** | Lógica de cliente y DOM         |
| **Fetch API**         | Comunicación con backend        |

---

## 📚 API Endpoints

### Autenticación

```http
POST   /users/register          # Registrar nuevo usuario
POST   /users/login             # Iniciar sesión (obtener JWT)
GET    /users/me                # Obtener datos del usuario actual
PUT    /users/me                # Actualizar perfil
```

### Productos y Tienda

```http
GET    /products/               # Listar productos activos
GET    /products/{id}           # Obtener producto específico
POST   /products/upload/        # Subir imagen (Admin)
POST   /products/               # Crear producto (Admin)
PUT    /products/{id}           # Actualizar producto (Admin)
```

### Pedidos

```http
POST   /orders/                 # Crear pedido (comprar)
GET    /orders/my-orders        # Mis pedidos
GET    /orders/{id}             # Detalle de pedido (Admin)
```

### Juegos

```http
POST   /games/score             # Enviar puntuación
GET    /games/leaderboard       # Top puntuaciones
GET    /games/my-scores         # Mis puntuaciones
```

📖 **Documentación interactiva completa**: http://localhost:8000/docs

---

## 🎮 Usuarios de Prueba

### Usuario Normal

```
Email: user@test.com
Contraseña: password123
```

### Administrador

```
Email: admin@test.com
Contraseña: admin123
```

---

## 🔧 Comandos Útiles

```bash
# Iniciar aplicación (ambos servidores)
./start_dev.sh

# Detener todos los servidores
./stop.sh

# Solo Backend (desarrollo)
cd BackEnd
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Solo Frontend (desarrollo)
cd FronteEnd
python -m http.server 5500

# Ver logs del servidor
tail -f server.log
```

---

## 🐛 Solución de Problemas

### Error: "Connection refused" al conectar a MySQL

```bash
# Verificar que MySQL esté corriendo
sudo service mysql status  # Linux
brew services list          # macOS

# Iniciar MySQL si está detenido
sudo service mysql start    # Linux
brew services start mysql   # macOS
```

### Error: "Module not found"

```bash
# Reinstalar dependencias
cd BackEnd
source venv/bin/activate
pip install -r requirements.txt
```

### Puerto 5500 o 8000 ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :5500
lsof -i :8000

# Matar el proceso (reemplaza PID)
kill -9 <PID>
```

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios importantes:

1. **Fork** el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/MiFeature`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva feature'`)
4. Push a la rama (`git push origin feature/MiFeature`)
5. Abre un **Pull Request**

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**Luis Parrach**

- GitHub: [@Luisparrach22](https://github.com/Luisparrach22)
- Proyecto: [La Previa Maldita](https://github.com/Luisparrach22/La_Previa_Maldita)

---

## 📞 Soporte

¿Problemas o preguntas? Abre un [issue](https://github.com/Luisparrach22/La_Previa_Maldita/issues) o contacta al equipo.

---

<div align="center">

**🎃 ¿Preparado para gritar?**

Made with ❤️ and ☠️ in España

</div>
