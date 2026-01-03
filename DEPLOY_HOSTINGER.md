# 🚀 Guía de Despliegue en Hostinger (La Previa Maldita)

Esta guía te ayudará a subir tu proyecto a Hostinger. Como tienes el Frontend (HTML/JS) separado del Backend (Python/FastAPI), hay dos formas principales de hacerlo dependiendo de tu plan.

---

## 📁 1. Preparación de Archivos

### Frontend

1. Ve a la carpeta `FronteEnd`.
2. Asegúrate de que `assets/js/modules/config.js` tenga la URL correcta de tu backend en producción.
   - Si vas a subir el backend también, espera a tener su URL para actualizar este archivo.
3. Comprime todo el contenido de la carpeta `FronteEnd` (index.html, pages, assets, etc.) en un archivo zip llamado `frontend.zip`.

### Backend

1. Ve a la carpeta `BackEnd`.
2. Asegúrate de tener el archivo `requirements.txt` actualizado.
3. Comprime todo el contenido de la carpeta `BackEnd` en un archivo zip llamado `backend.zip`.

---

## 🌐 2. Opción A: Hostinger VPS (Recomendado para Python)

_Si tienes un plan VPS (KVM), esta es la mejor opción._

1. **Accede a tu VPS** vía SSH.
2. **Instala las dependencias**:
   ```bash
   apt update && apt install python3-pip python3-venv mysql-server nginx git
   ```
3. **Sube tus archivos** (puedes usar SFTP como FileZilla).
4. **Configura el Backend**:
   ```bash
   cd /var/www/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
5. **Configura el servicio Systemd** para mantenerlo activo:

   - Crea un archivo `/etc/systemd/system/laprevia.service`.
   - Ejecuta `systemctl enable laprevia --now`.

6. **Configura Nginx** como Proxy Inverso:
   - Apunta `tudominio.com` al puerto 8000 del backend.
   - Apunta `tudominio.com` (root) a los archivos del frontend en `/var/www/html`.

---

## ☁️ 3. Opción B: Hostinger Shared Hosting (Web Hosting)

_Si tienes un plan "Premium" o "Business" Web Hosting._

**⚠️ Nota:** El soporte para Python en hosting compartido es limitado. Es posible que debas usar la función "Setup Python App" si está disponible en tu cPanel/hPanel.

### Paso 1: Subir el Frontend

1. Ve al **Administrador de Archivos** en Hostinger.
2. Entra a `public_html`.
3. Sube y descomprime tu `frontend.zip`.
4. Ahora tu sitio web debería ser visible (pero sin funcionar la lógica porque falta el backend).

### Paso 2: Subir el Backend

1. En el Administrador de Archivos, crea una carpeta fuera de `public_html` llamada `backend_app`.
2. Sube y descomprime `backend.zip` allí.

### Paso 3: Configurar Python (Si hPanel lo permite)

1. Busca **"Python"** o **"Setup Python App"** en el hPanel.
2. Crea una nueva aplicación:
   - **Versión:** 3.9 o superior.
   - **App Directory:** `backend_app`.
   - **App Domain:** `api.tudominio.com` (recomendado crear un subdominio para la API).
3. Instala las dependencias usando el archivo `requirements.txt` desde la interfaz.
4. Puede que necesites configurar un archivo `passenger_wsgi.py` para conectar FastAPI con el servidor Passenger de Hostinger.

### Paso 4: Base de Datos

1. Ve a **Bases de Datos MySQL** en hPanel.
2. Crea una nueva base de datos y usuario.
3. Edita el archivo `.env` en tu backend (en el servidor) con las nuevas credenciales.

---

## 🔗 4. Conectar Frontend y Backend

Una vez que tu backend esté funcionando (ej: en `https://api.tusitio.com`), vuelve a tu archivo local:

1. Abre `FronteEnd/assets/js/modules/config.js`.
2. Actualiza la variable `PROD_API_URL`:
   ```javascript
   const PROD_API_URL = "https://api.tusitio.com";
   ```
3. Vuelve a subir el archivo `config.js` al servidor (sobrescribe el existente en `public_html/assets/js/modules/`).

¡Listo! Tu aplicación estará desplegada.
