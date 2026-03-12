#!/bin/bash
# ============================================================
# NOMINI - Script de Despliegue
# Uso: bash deploy.sh [VPS_USER@VPS_IP]
# Ejemplo: bash deploy.sh root@192.168.1.100
# ============================================================

set -e

VPS=${1:-""}
IMAGE="nomini:latest"

echo ">>> [1/4] Verificando variables de entorno..."
: "${VITE_SUPABASE_URL:?ERROR: Falta VITE_SUPABASE_URL en .env.local}"
: "${VITE_SUPABASE_ANON_KEY:?ERROR: Falta VITE_SUPABASE_ANON_KEY en .env.local}"
echo "    OK - Variables configuradas"

echo ">>> [2/4] Construyendo imagen Docker..."
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" \
  -t $IMAGE .
echo "    OK - Imagen construida"

if [ -z "$VPS" ]; then
  # ── Despliegue LOCAL ──────────────────────────────────────
  echo ">>> [3/4] Levantando contenedor local en puerto 80..."
  docker compose down 2>/dev/null || true
  docker compose up -d
  echo "    OK - App corriendo en http://localhost"
  echo ">>> [4/4] NOMINI desplegado localmente."
else
  # ── Despliegue en VPS ─────────────────────────────────────
  echo ">>> [3/4] Exportando imagen y enviando al VPS $VPS..."
  docker save $IMAGE | gzip | ssh "$VPS" "gunzip | docker load"

  echo ">>> [4/4] Ejecutando en el servidor..."
  ssh "$VPS" "
    docker stop nomini-app 2>/dev/null || true
    docker rm nomini-app   2>/dev/null || true
    docker run -d \
      --name nomini-app \
      --restart unless-stopped \
      -p 80:80 \
      $IMAGE
  "
  echo "    OK - NOMINI desplegado en http://$VPS"
fi
