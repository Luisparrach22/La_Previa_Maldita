---
description: Flujo de trabajo profesional con entornos Local y Producción
---

# 🎃 Flujo de Trabajo Profesional: Local vs Producción

Este documento describe cómo trabajar de manera segura teniendo una versión de **Trabajo (Local)** y una versión de **Producción** estrictamente separadas.

## 1. La Estrategia de Ramas (Branches)

En lugar de duplicar carpetas (que causa errores y desorden), usamos Git:

- **Rama `main` (PRODUCCIÓN)**: Esta es la versión sagrada. Lo que hay aquí es lo que está en el servidor. NUNCA trabajes directamente aquí.
- **Rama `pruebas` (LOCAL / DEV)**: Aquí es donde haces el trabajo sucio. Es tu entorno de laboratorio. Puedes romper cosas aquí sin miedo.

## 2. Configuración (Code vs Config)

El código es el mismo, pero la configuración cambia según donde estés.

- **En tu PC (Local)**: Usas el archivo `.env` que está en tu carpeta. Este archivo contiene tus contraseñas y URLs de base de datos _locales_.
- **En el Servidor (Producción)**: El servidor (Railway/Hostinger) tiene sus propias variables configuradas en su panel de control.

## 3. Comandos para Trabajar

### A. Para empezar a trabajar (Modo Local)

Simplemente asegúrate de estar en la rama de `pruebas`.

```bash
git checkout pruebas
./start_dev.sh
```

Esto arrancará tu entorno local. Todo lo que hagas aquí es seguro.

### B. Para enviar cambios a Producción

Cuando hayas terminado y probado tus cambios en local, usa este script automatizado para enviar cambios a producción de forma segura:

```bash
./deploy_prod.sh
```

Este script hará lo siguiente por ti:

1. Guardará tus cambios locales.
2. Se cambiará a la rama principal.
3. Fusionará tus cambios.
4. Los enviará a la nube.
5. Volverá a tu rama de pruebas para que sigas trabajando.

---

**Nota Profesional**: Si alguna vez "duplicas la carpeta", te arriesgas a que una carpeta tenga correcciones de seguridad y la otra no. Usar ramas es el estándar de la industria (Google, Facebook, Amazon trabajan así).
