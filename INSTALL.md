# 🚀 Guía de Instalación Rápida - La Previa Maldita

## Para Usuarios (Primera Vez)

### 1️⃣ Instalar Prerrequisitos

#### macOS

```bash
# Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Python y MySQL
brew install python@3.9 mysql
brew services start mysql
```

#### Windows

1. Descargar e instalar [Python 3.9+](https://www.python.org/downloads/)
2. Descargar e instalar [MySQL 8.0+](https://dev.mysql.com/downloads/installer/)
3. Durante la instalación de MySQL, anota tu contraseña de root

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install python3.9 python3-pip python3-venv mysql-server
sudo systemctl start mysql
```

---

### 2️⃣ Clonar y Configurar

```bash
# Clonar el repositorio
git clone https://github.com/Luisparrach22/La_Previa_Maldita.git
cd La_Previa_Maldita

# Ejecutar configuración automática
chmod +x setup.sh
./setup.sh
```

---

### 3️⃣ Configurar Base de Datos

#### Crear la base de datos

```bash
# Iniciar sesión en MySQL
mysql -u root -p

# Dentro de MySQL, ejecutar:
CREATE DATABASE IF NOT EXISTS la_previa_db;
exit;
```

#### Editar credenciales

Abre `BackEnd/.env` y modifica la línea `DATABASE_URL`:

```env
# Cambia 'root' y 'password' por tus credenciales
DATABASE_URL=mysql+pymysql://root:tu_password@localhost:3306/la_previa_db
```

---

### 4️⃣ ¡Iniciar la Aplicación!

```bash
./start_dev.sh
```

Abre tu navegador en: **http://localhost:5500**

---

## Para Desarrolladores (Desarrollo)

### Iniciar solo Backend

```bash
cd BackEnd
source venv/bin/activate  # En Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Iniciar solo Frontend

```bash
cd FronteEnd
python -m http.server 5500
```

---

## Detener la Aplicación

```bash
./stop.sh
```

---

## Problemas Comunes

### ❌ Error: "Command not found: python3"

**Solución**: Instala Python 3.9+

- macOS: `brew install python@3.9`
- Windows: [Descargar instalador](https://www.python.org/downloads/)
- Linux: `sudo apt install python3.9`

### ❌ Error: "Access denied for user 'root'@'localhost'"

**Solución**: Tu contraseña de MySQL es incorrecta. Edita `BackEnd/.env`

### ❌ Error: "Port 5500 is already in use"

**Solución**:

```bash
# macOS/Linux
lsof -i :5500
kill -9 <PID>

# Windows
netstat -ano | findstr :5500
taskkill /PID <PID> /F
```

---

## Usuarios de Prueba

Una vez iniciada la aplicación, puedes usar estos usuarios:

**Usuario Normal:**

- Email: `user@test.com`
- Contraseña: `password123`

**Administrador:**

- Email: `admin@test.com`
- Contraseña: `admin123`

---

## Próximos Pasos

1. 📖 Lee el [README.md](README.md) completo
2. 🎮 Prueba los juegos en http://localhost:5500/pages/user_page.html
3. 👨‍💼 Accede al panel admin en http://localhost:5500/pages/admin.html
4. 📚 Explora la API en http://localhost:8000/docs

---

**¿Necesitas ayuda?** Abre un [issue en GitHub](https://github.com/Luisparrach22/La_Previa_Maldita/issues)
