# 🎃 La Previa Maldita

> **"Donde tus pesadillas cobran vida..."**
> El evento de terror más escalofriante del año universitario.

[![Status](https://img.shields.io/badge/Status-Inmersive_Experience-red?style=for-the-badge&logo=ghost)](https://github.com/Luisparrach22/La_Previa_Maldita)
[![Version](https://img.shields.io/badge/Version-1.5.0-black?style=for-the-badge)](https://github.com/Luisparrach22/La_Previa_Maldita)

Bienvenido al repositorio oficial de **La Previa Maldita**, una plataforma web inmersiva diseñada para el evento de terror de Halloween 2025. Los usuarios pueden explorar la información del evento, comprar tickets al inframundo, adquirir mercancía maldita en la tienda, y jugar a minijuegos terroríficos para recolectar **almas 👻**.

---

## 📖 Sobre el Proyecto

**La Previa Maldita** es una experiencia digital completa. Cuenta con un diseño horror-aesthetic, animaciones inmersivas, integración de autenticación (incluido Google Sign-In) y un ecosistema de tienda/carrito impulsado por un backend robusto.

📍 **Fecha del Ritual:** 31 de Octubre de 2025  
🕛 **Hora de Apertura:** Medianoche  
🌑 **Ubicación:** Secreta (Solo para poseedores de tickets)

---

## ✨ Características Principales

### 👤 Experiencia del Usuario

- **🔐 Portal de Almas:** Registro e inicio de sesión seguro (JWT + Argon2) o mediante Google Sign-In.
- **🎫 Tickets al Inframundo:** Sistema de compra de pases con generación dinámica de **Códigos QR** únicos.
- **🩸 Tienda Maldita:** Catálogo interactivo con filtros para "merchandising", comida y pociones. Carrito de compras en tiempo real.
- **🎮 Juegos Mortales:** Mini-juegos para ganar almas:
  - 👻 _Whack-a-Ghost:_ Reflejos puros contra espectros.
  - 🧠 _Trivia Maldita:_ ¿Cuánto sabes de terror?
  - 🃏 _Memoria Letal:_ Cartas malditas que desafían tu mente.
- **🔮 El Oráculo:** Chatbot interactivo para guiar a los perdidos.

### 🛡️ Panel de Administración (Poder Absoluto)

- **📊 Centro de Mando:** Estadísticas en tiempo real de usuarios, pedidos y ventas.
- **👤 Gestión de Almas:** Control total sobre usuarios, roles (Admin/VIP/Mortal) y saldos.
- **📦 Inventario Siniestro:** CRUD completo de productos y tickets con carga de imágenes.
- **🎟️ VALIDACIÓN QR:** Sistema de escaneo de tickets mediante cámara (BarcodeDetector API) para acceso instantáneo al evento.
- **📝 Órdenes:** Seguimiento detallado y cambio de estados de pedidos.

---

## 🛠 Tecnologías y Stack

### 💻 Frontend (Nativo & Puro)

- **HTML5 & CSS3:** Diseño responsivo, variables CSS y animaciones `@keyframes`.
- **Vanilla JS (ES6+):** Lógica modular sin dependencias pesadas.
- **Google Identity Services:** Autenticación moderna.
- **BarcodeDetector:** Tecnología nativa para escaneo de QR.

### ⚙️ Backend (Alto Rendimiento)

- **[FastAPI](https://fastapi.tiangolo.com/):** Framework asíncrono ultra-rápido.
- **SQLAlchemy:** ORM potente para gestión MySQL/MariaDB.
- **JWT & Argon2:** Seguridad de grado militar para identidades.
- **Pydantic:** Validación de datos estricta.

---

## 🚀 Instalación y Ritual de Inicio

### Requisitos

- MySQL / MariaDB
- Python 3.9+
- Node.js o Live Server

### Pasos

1. **Invocar el Código:**

   ```bash
   git clone https://github.com/Luisparrach22/La_Previa_Maldita.git
   cd La_Previa_Maldita
   ```

2. **Preparar el Backend:**

   ```bash
   cd Backend
   # Configura tu .env basado en .env.example
   bash setup.sh
   ```

3. **Despertar el Sistema:**
   ```bash
   bash start_dev.sh
   ```
   _Backend: `http://localhost:8000/docs` | Frontend: `index.html`_

---

## 📜 Licencia

Desarrollado para **La Previa Maldita 2025**. Todos los derechos de diseño, marca y código reservados.

---

_¿Sobrevivirás a la noche más oscura del año?_ 🦇

[Subir al inicio](#-la-previa-maldita)
