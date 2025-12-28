#!/bin/bash

echo "Deteniendo servidores..."

# Detener el backend (Uvicorn)
pkill -f uvicorn
if [ $? -eq 0 ]; then
    echo "✅ Backend (Uvicorn) detenido."
else
    echo "ℹ️ No se encontró el proceso de Backend corriendo."
fi

# Detener el frontend (Live Server / Python http.server)
pkill -f "python3 -m http.server"
pkill -f "python -m http.server"
if [ $? -eq 0 ]; then
    echo "✅ Frontend detenido."
else
    echo "ℹ️ No se encontró el proceso de Frontend corriendo."
fi

echo "Servidores eliminados."
