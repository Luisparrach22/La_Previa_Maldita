#!/bin/bash
echo "🩸 Deteniendo La Previa Maldita..."
lsof -ti:8000,5500 | xargs kill -9 2>/dev/null || true
echo "💀 Servidores eliminados."
