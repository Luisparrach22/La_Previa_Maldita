# 🚀 Guía de Despliegue a Producción

Este documento describe **exactamente** qué configuraciones debes verificar/cambiar antes de subir el proyecto a producción.

---

## ✅ Checklist Rápido

Antes de desplegar, asegúrate de:

- [ ] Configurar las **variables de entorno** en el servidor
- [ ] Verificar la **URL de la API** en el Frontend
- [ ] Configurar los **orígenes CORS** permitidos
- [ ] Usar una **SECRET_KEY** segura y única

---

## 1. 🔧 Variables de Entorno del Backend

En tu servidor de producción (Railway, Hostinger, etc.), debes configurar estas variables:

| Variable                      | Descripción                                 | Ejemplo                                           |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                | Conexión a MySQL                            | `mysql+pymysql://user:pass@host:3306/db_name`     |
| `SECRET_KEY`                  | Clave secreta para JWT (¡genera una nueva!) | `tu_clave_super_secreta_unica_123`                |
| `ALGORITHM`                   | Algoritmo de encriptación                   | `HS256`                                           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token                          | `10080` (7 días)                                  |
| `ALLOWED_ORIGINS`             | URLs permitidas para CORS                   | `https://tudominio.com,https://www.tudominio.com` |

### ⚠️ Generar una SECRET_KEY segura

Ejecuta esto en Python para generar una clave:

```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## 2. 🌐 Configuración del Frontend

**Archivo:** `Frontend/assets/js/modules/config.js`

```javascript
// Cambia esta URL por la de tu backend en producción
const PROD_API_URL = "https://tu-api.tudominio.com";

export const IS_LOCAL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
export const API_URL = IS_LOCAL ? "http://localhost:8000" : PROD_API_URL;
```

### Qué cambiar:

| Valor          | Local           | Producción                                    |
| -------------- | --------------- | --------------------------------------------- |
| `PROD_API_URL` | N/A (no se usa) | `https://api.tudominio.com` o IP del servidor |

**Nota:** El código detecta automáticamente si estás en local o producción. Solo debes asegurarte de que `PROD_API_URL` apunte a tu backend real.

---

## 3. 🔒 CORS (Orígenes Permitidos)

En el servidor, configura la variable `ALLOWED_ORIGINS` con los dominios desde donde se accederá:

```bash
# Ejemplo para Hostinger/Railway
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com,https://admin.tudominio.com
```

**No incluyas localhost en producción** (a menos que necesites depurar remotamente).

---

## 4. 📂 Resumen de Archivos Importantes

| Archivo                                | Uso                          | ¿Se sube a Git?            |
| -------------------------------------- | ---------------------------- | -------------------------- |
| `Backend/.env`                         | Variables locales            | ❌ NO (está en .gitignore) |
| `Backend/.env.example`                 | Plantilla de ejemplo         | ✅ SÍ                      |
| `Frontend/assets/js/modules/config.js` | URL de la API                | ✅ SÍ                      |
| `Backend/app/config.py`                | Lee las variables de entorno | ✅ SÍ                      |

---

## 5. 🛠️ Proceso de Despliegue

### Opción A: Usando el script automatizado

```bash
./deploy_prod.sh
```

### Opción B: Manual

```bash
# 1. Guardar cambios en pruebas
git add .
git commit -m "Preparar para producción"

# 2. Cambiar a main y fusionar
git checkout main
git merge pruebas

# 3. Subir a la nube
git push origin main

# 4. Volver a trabajar
git checkout pruebas
```

---

## 6. 🏗️ Configuración por Plataforma

### Railway

En el dashboard de Railway, ve a **Variables** y añade cada variable listada arriba.

### Hostinger VPS

Crea un archivo `.env` en el servidor:

```bash
nano /home/usuario/La_Previa_Maldita/Backend/.env
```

Y añade:

```env
DATABASE_URL=mysql+pymysql://usuario:contraseña@localhost:3306/la_previa_db
SECRET_KEY=tu_clave_super_segura_generada
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=https://tudominio.com
```

---

## 7. 🔍 Verificación Post-Despliegue

Después de desplegar, verifica que todo funciona:

1. **API Health Check:**

   ```
   https://tu-api.com/health
   ```

   Debe responder: `{"status": "healthy", "message": "🎃 La Previa Maldita está viva!"}`

2. **Documentación API:**

   ```
   https://tu-api.com/docs
   ```

3. **Frontend:** Abre tu dominio y verifica que:
   - El login funciona
   - Los productos cargan
   - El carrito funciona

---

## ❓ Problemas Comunes

| Error                        | Causa                   | Solución                               |
| ---------------------------- | ----------------------- | -------------------------------------- |
| `401 Unauthorized`           | SECRET_KEY diferente    | Usa la misma SECRET_KEY en el servidor |
| `CORS error`                 | Origen no permitido     | Añade el dominio a `ALLOWED_ORIGINS`   |
| `502 Bad Gateway`            | Backend no arranca      | Revisa logs del servidor               |
| `Database connection failed` | DATABASE_URL incorrecta | Verifica credenciales MySQL            |

---

**¡Listo!** Con esta guía tienes todo lo necesario para desplegar de forma segura. 🎃
