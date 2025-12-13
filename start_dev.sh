#!/bin/bash

# ============================================================================
# LA PREVIA MALDITA - Script de Desarrollo
# Arranca Backend (FastAPI) y Frontend (HTTP Server) simultáneamente
# ============================================================================

echo "🎃 Iniciando La Previa Maldita..."
echo ""

# Directorio base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servicios detenidos"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# ============================================================================
# BACKEND - FastAPI (Puerto 8000)
# ============================================================================
echo "🚀 Iniciando Backend (FastAPI) en http://localhost:8000..."
cd "$BASE_DIR/BackEnd"

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Iniciar uvicorn en background
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Esperar un momento para que el backend arranque
sleep 2

# ============================================================================
# FRONTEND - HTTP Server (Puerto 5500)
# ============================================================================
echo "🌐 Iniciando Frontend en http://localhost:5500..."
cd "$BASE_DIR/FronteEnd"

# Iniciar servidor HTTP en background
python3 -m http.server 5500 &
FRONTEND_PID=$!

# ============================================================================
# INFORMACIÓN
# ============================================================================
echo ""
echo "=============================================="
echo "🎃 LA PREVIA MALDITA - Servicios Activos"
echo "=============================================="
echo ""
echo "📡 Backend API:    http://localhost:8000"
echo "📡 API Docs:       http://localhost:8000/docs"
echo "🌐 Frontend:       http://localhost:5500"
echo "👤 Admin Panel:    http://localhost:5500/admin.html"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios"
echo "=============================================="
echo ""

# Mantener el script corriendo
wait
