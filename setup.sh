#!/bin/bash

echo "🎃 Configurando La Previa Maldita..."
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL no está instalado. Instálalo antes de continuar."
    echo "   macOS: brew install mysql"
    echo "   Ubuntu: sudo apt install mysql-server"
    exit 1
fi

echo "✅ Prerrequisitos verificados"
echo ""

# Backend Setup
echo "📦 Configurando Backend..."
cd BackEnd

if [ ! -d "venv" ]; then
    echo "   Creando entorno virtual..."
    python3 -m venv venv
fi

echo "   Activando entorno virtual..."
source venv/bin/activate

echo "   Instalando dependencias..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Configurar .env si no existe
if [ ! -f ".env" ]; then
    echo "   Creando archivo .env..."
    cat > .env << EOF
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/la_previa_db
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=optional_google_client_id
EOF
    echo ""
    echo "   ⚠️  IMPORTANTE: Edita BackEnd/.env con tus credenciales de MySQL"
    echo "      Usuario y contraseña actuales: root:password"
    echo ""
fi

cd ..

echo "✅ Configuración completa!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Edita BackEnd/.env con tus credenciales de MySQL"
echo "   2. Crea la base de datos: mysql -u root -p -e 'CREATE DATABASE IF NOT EXISTS la_previa_db;'"
echo "   3. Ejecuta: ./start_dev.sh"
echo ""
