# 📦 Qué se Sube y Qué NO se Sube a Producción

Este documento lista exactamente qué archivos van a la rama `main` (producción) y cuáles están protegidos.

---

## ✅ SE SUBE A PRODUCCIÓN (rama `main`)

### Backend

| Archivo/Carpeta            | Descripción                                              |
| -------------------------- | -------------------------------------------------------- |
| `Backend/app/*.py`         | Todo el código Python (main, routers, models, etc.)      |
| `Backend/app/config.py`    | Configuración centralizada (lee de variables de entorno) |
| `Backend/app/routers/`     | Todos los endpoints de la API                            |
| `Backend/requirements.txt` | Dependencias de Python                                   |
| `Backend/.env.example`     | Plantilla de ejemplo para configurar el servidor         |

### Frontend

| Archivo/Carpeta           | Descripción                               |
| ------------------------- | ----------------------------------------- |
| `Frontend/index.html`     | Página principal                          |
| `Frontend/pages/`         | Páginas adicionales (admin, user)         |
| `Frontend/assets/css/`    | Todos los estilos                         |
| `Frontend/assets/js/`     | Todo el JavaScript incluyendo `config.js` |
| `Frontend/assets/images/` | Imágenes del sitio                        |
| `Frontend/assets/videos/` | Videos promocionales                      |

### Documentación y Scripts

| Archivo               | Descripción                            |
| --------------------- | -------------------------------------- |
| `README.md`           | Documentación principal                |
| `PRODUCCION.md`       | Guía de despliegue                     |
| `DEPLOY_HOSTINGER.md` | Instrucciones específicas de Hostinger |
| `INSTALL.md`          | Guía de instalación                    |
| `setup.sh`            | Script de configuración inicial        |
| `start_dev.sh`        | Script de desarrollo local             |
| `deploy_prod.sh`      | Script de despliegue                   |
| `.gitignore`          | Reglas de exclusión                    |

---

## ❌ NO SE SUBE A PRODUCCIÓN (protegido por .gitignore)

| Archivo/Carpeta                | Razón                                           |
| ------------------------------ | ----------------------------------------------- |
| `Backend/.env`                 | **CONTRASEÑAS Y SECRETOS** - Nunca subir        |
| `Backend/venv/`                | Entorno virtual Python (se crea en el servidor) |
| `**/__pycache__/`              | Archivos compilados de Python                   |
| `*.log`                        | Archivos de log                                 |
| `.DS_Store`                    | Archivos de sistema macOS                       |
| `.vscode/`                     | Configuración del editor                        |
| `Backend/app/static/uploads/*` | Archivos subidos por usuarios                   |
| `*.db`, `*.sqlite`             | Bases de datos locales                          |

---

## 🔐 Archivos Sensibles que DEBES Crear en el Servidor

Cuando configures el VPS, deberás crear estos archivos manualmente:

### 1. Backend/.env

```bash
# En el servidor, crea este archivo:
nano /ruta/al/proyecto/Backend/.env
```

Contenido:

```env
DATABASE_URL=mysql+pymysql://USUARIO:CONTRASEÑA@localhost:3306/la_previa_db
SECRET_KEY=TU_CLAVE_SECRETA_UNICA_GENERADA
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

### 2. Entorno Virtual

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🚀 Comando para Subir a Producción

Desde tu rama `pruebas`, ejecuta:

```bash
./deploy_prod.sh
```

O manualmente:

```bash
git checkout main
git merge pruebas
git push origin main
git checkout pruebas
```

---

## 📋 Checklist Final para tus Compañeros

Cuando tus compañeros clonen el proyecto en el VPS:

1. [ ] Clonar el repositorio
2. [ ] Crear `Backend/.env` con las credenciales reales
3. [ ] Crear la base de datos MySQL
4. [ ] Crear el entorno virtual y dependencias
5. [ ] Configurar Uvicorn como servicio o usar PM2/Supervisor
6. [ ] Configurar Nginx como proxy reverso
7. [ ] Probar en `https://tudominio.com`

---

**Resumen:** Todo el código se sube. Las contraseñas y archivos locales NO se suben nunca. 🔒
