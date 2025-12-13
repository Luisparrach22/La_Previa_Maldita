#!/bin/bash

# ============================================================================
# LA PREVIA MALDITA - DEV LAUNCHER
# ============================================================================

# Colores y estilos
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Limpiar terminal
clear

echo -e "${RED}${BOLD}"
echo "   (       )  "
echo "   )\ ) ( /(  "
echo "  (()/( )\()) "
echo "   /(_)|(_)\  "
echo "  (_))  _((_) "
echo "  | |  | || | "
echo "  | |__| __ | "
echo "  |____|_||_| "
echo -e "${NC}"
echo -e "${BOLD}🎃 LA PREVIA MALDITA - ENVIRONMENT CHARGING...${NC}"
echo ""

# Directorio base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Función Cleanup
cleanup() {
    echo ""
    echo -e "${RED}🛑 Deteniendo servicios...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Iniciar BACKEND
echo -ne "� Iniciando Backend Node...\r"
cd "$BASE_DIR/BackEnd"
if [ -d "venv" ]; then source venv/bin/activate; fi
# Redirigimos stderr a un log temporal pero mantenemos stdout limpio
uvicorn app.main:app --reload --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend Activo ${NC}"

# 2. Iniciar FRONTEND
echo -ne "🌐 Iniciando Frontend...\r"
cd "$BASE_DIR/FronteEnd"
# Python http.server es ruidoso, silenciamos su output
python3 -m http.server 5500 > /dev/null 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend Activo${NC}"

# Esperar un momento para asegurar arranque
sleep 2

# 3. DASHBOARD DE ESTADO
clear
echo -e "${RED}${BOLD}"
echo "🎃 LA PREVIA MALDITA - SERVIDORES ACTIVOS"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}� ACCESO RÁPIDO (Ctrl + Click)${NC}"
echo ""
echo -e "   🏠 ${BOLD}WEB APP:${NC}       ${CYAN}http://localhost:5500${NC}"
echo -e "   👤 ${BOLD}ADMIN PANEL:${NC}   ${CYAN}http://localhost:5500/admin.html${NC}"
echo -e "   � ${BOLD}API DOCS:${NC}      ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}ℹ️  Logs:${NC}"
echo -e "   • Backend PID: $BACKEND_PID"
echo -e "   • Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${RED}[ Presiona Ctrl+C para detener todo ]${NC}"

# Mantener vivo
wait
