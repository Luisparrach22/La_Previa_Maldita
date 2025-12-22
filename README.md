# 🎃 La Previa Maldita

<div align="center">

![Header](https://img.shields.io/badge/🍷-Come,%20Bebe%20y%20Grita-8B0000?style=for-the-badge)

**Plataforma Full-Stack de Gestión de Eventos de Terror**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-success?style=flat-square)](LICENSE)

[Demo](#-inicio-rápido) • [Características](#-características) • [Stack](#️-tecnologías)

</div>

---

## 🎯 Descripción

Sistema completo de gestión de eventos con **economía virtual**, **gamificación** y **panel administrativo**. Los usuarios pueden comprar tickets, jugar minijuegos para ganar "Almas" (puntos) y competir en el leaderboard.

---

## ✨ Características

<table>
<tr>
<td width="50%">

### 🛒 Sistema de Comercio

- 💰 Economía de "Almas" (moneda virtual)
- 🎟️ Compra de tickets y productos
- 📦 Gestión de pedidos en tiempo real
- 🖼️ Carga de imágenes desde dispositivo

</td>
<td width="50%">

### 🎮 Gamificación

- 🔨 **Caza-Espectros**: Whack-a-Mole
- 🧠 **Trivia Terror**: Quiz de horror
- 🃏 **Memoria Letal**: Memory Game
- 🏆 Sistema de puntuación global

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Autenticación

- 🔑 JWT Token seguro
- 👤 Registro/Login completo
- 🌐 OAuth con Google
- 👥 Roles (User/Admin/VIP)

</td>
<td width="50%">

### 👨‍💼 Panel Admin

- 📊 Dashboard con estadísticas
- 👥 Gestión de usuarios
- 📦 Control de productos/pedidos
- ✅ Validación de tickets QR

</td>
</tr>
</table>

---

## 🚀 Inicio Rápido

### Instalación Automática (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/Luisparrach22/La_Previa_Maldita.git
cd La_Previa_Maldita

# 2. Ejecutar setup automático
./setup.sh

# 3. Crear base de datos
mysql -u root -p -e "CREATE DATABASE la_previa_db;"

# 4. Iniciar aplicación
./start_dev.sh
```

### Acceso

- 🌐 **Frontend**: http://localhost:5500
- 📡 **API REST**: http://localhost:8000
- 📚 **Documentación**: http://localhost:8000/docs
- 👨‍💼 **Admin Panel**: http://localhost:5500/pages/admin.html

### Usuarios de Prueba

| Rol        | Email            | Contraseña    |
| ---------- | ---------------- | ------------- |
| 👤 Usuario | `user@test.com`  | `password123` |
| 👨‍💼 Admin   | `admin@test.com` | `admin123`    |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Client)                   │
│  HTML5 + CSS3 + JavaScript ES6+ │ Fetch API             │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API (JWT Auth)
┌─────────────────▼───────────────────────────────────────┐
│                  BACKEND (FastAPI)                      │
│  Python 3.9+ │ Pydantic │ SQLAlchemy ORM                │
└─────────────────┬───────────────────────────────────────┘
                  │ SQL Queries
┌─────────────────▼───────────────────────────────────────┐
│              DATABASE (MySQL 8.0)                       │
│  Users │ Products │ Orders │ Scores │ Sessions          │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías

### Backend

- **FastAPI** - Framework web asíncrono de alto rendimiento
- **SQLAlchemy** - ORM para gestión de base de datos
- **MySQL** - Sistema de gestión de base de datos
- **JWT** - Autenticación segura basada en tokens
- **Pydantic** - Validación de datos y schemas

### Frontend

- **HTML5/CSS3** - Estructura y diseño responsive
- **JavaScript ES6+** - Lógica de cliente y manipulación DOM
- **Fetch API** - Comunicación asíncrona con backend

---

## � Estructura del Proyecto

```
La_Previa_Maldita/
├── 📁 BackEnd/
│   ├── app/
│   │   ├── routers/          # Endpoints API
│   │   ├── static/uploads/   # Imágenes de productos
│   │   ├── main.py           # Servidor principal
│   │   ├── models.py         # Modelos de BD
│   │   └── schemas.py        # Validación Pydantic
│   └── requirements.txt      # Dependencias Python
│
├── 📁 FronteEnd/
│   ├── assets/
│   │   ├── css/              # Estilos temáticos
│   │   ├── js/               # Lógica de cliente
│   │   └── images/           # Assets gráficos
│   ├── pages/
│   │   ├── admin.html        # Panel admin
│   │   └── user_page.html    # Dashboard usuario
│   └── index.html            # Página principal
│
├── setup.sh                  # Configuración automática
├── start_dev.sh              # Iniciar aplicación
└── stop.sh                   # Detener servidores
```

---

## 📋 Prerrequisitos

- Python 3.9+
- MySQL 8.0+
- Git

---

## 🔧 Comandos Útiles

```bash
# Iniciar aplicación
./start_dev.sh

# Detener servidores
./stop.sh

# Ver documentación API
open http://localhost:8000/docs
```

---

## � Capturas

### 🏠 Landing Page

Interface principal con diseño dark-horror themed, trailer integrado y sistema de registro.

### 🎮 Juegos

Tres minijuegos interactivos donde los usuarios ganan "Almas" que se sincronizan con el backend.

### 👨‍💼 Panel Admin

Dashboard completo con gestión de usuarios, productos, pedidos y validación de tickets.

---

## 🤝 Contribución

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -m 'Add: nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**Luis Parrach**

[![GitHub](https://img.shields.io/badge/GitHub-Luisparrach22-181717?style=flat-square&logo=github)](https://github.com/Luisparrach22)

---

<div align="center">

**🎃 ¿Preparado para gritar?**

Made with ❤️ and ☠️

</div>
