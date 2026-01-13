#!/bin/bash

# ============================================================================
# LA PREVIA MALDITA - DEV LAUNCHER (BACKGROUND MODE)
# ============================================================================

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Limpiar pantalla
clear

echo -e "🎃 ${GREEN}Iniciando La Previa Maldita en segundo plano...${NC}"

# 1. Iniciar BACKEND
cd "$BASE_DIR/Backend"
if [ -d "venv" ]; then source venv/bin/activate; fi
nohup uvicorn app.main:app --reload --port 8000 > "$BASE_DIR/server.log" 2>&1 &
BACKEND_PID=$!

# 2. Iniciar FRONTEND
cd "$BASE_DIR/Frontend"
nohup python3 -m http.server 5500 > /dev/null 2>&1 &
FRONTEND_PID=$!

# Esperar un instante para asegurar que arrancaron
sleep 1

echo -e "${GREEN}✅ Servidores listos y corriendo en segundo plano.${NC}"
echo ""
echo -e "   🏠 Web:   ${CYAN}http://localhost:5500${NC}"
echo -e "   📡 API:   ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "💡 Usa ${RED}./stop.sh${NC} para detener los servidores cuando termines."
echo ""
