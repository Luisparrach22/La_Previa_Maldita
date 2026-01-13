#!/bin/bash
# ============================================================================
# SCRIPT DE DESPLIEGUE A PRODUCCIÓN
# ============================================================================

# Colores y Estilos
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Iniciando proceso de despliegue a Producción...${NC}"

# 1. Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "pruebas" ]; then
    echo -e "${RED}❌ Error: Debes estar en la rama 'pruebas' para desplegar.${NC}"
    echo "Usa: git checkout pruebas"
    exit 1
fi

# 2. Verificar estado de git
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Tienes cambios sin guardar. Guardándolos ahora...${NC}"
    git add .
    echo -n "Mensaje del commit (Enter para usar 'Update'): "
    read COMMIT_MSG
    COMMIT_MSG=${COMMIT_MSG:-"Update"}
    git commit -m "$COMMIT_MSG"
fi

# 3. Actualizar rama main
echo -e "${GREEN}🔄 Actualizando Producción (main)...${NC}"
git checkout main
git pull origin main

# 4. Fusionar cambios
echo -e "${GREEN}twisted_rightwards_arrows Fusionando cambios de pruebas a main...${NC}"
git merge pruebas

# 5. Subir a la nube
echo -e "${GREEN}☁️  Subiendo cambios al repositorio remoto...${NC}"
git push origin main

# 6. Volver a pruebas
echo -e "${GREEN}🔙 Volviendo al entorno de trabajo (pruebas)...${NC}"
git checkout pruebas

echo -e ""
echo -e "${GREEN}✅ ¡Despliegue completado con éxito!${NC}"
echo -e "Tu código de producción ahora está sincronizado con tu trabajo local."
