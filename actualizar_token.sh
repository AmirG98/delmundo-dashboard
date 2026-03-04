#!/bin/bash

# Script para actualizar el token de forma segura
# El token NUNCA sale de tu computadora

echo "═══════════════════════════════════════════════════════"
echo "  🔐 ACTUALIZAR TOKEN DE META - FORMA SEGURA"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANTE: Tu token NUNCA saldrá de esta computadora"
echo ""
echo "Pega tu token de Meta aquí:"
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo ""
    echo "❌ Token vacío. Cancelado."
    exit 1
fi

# Actualizar .env
cat > .env << EOF
META_ACCESS_TOKEN=${TOKEN}
META_AD_ACCOUNT_ID=act_1277401480450375
EOF

echo ""
echo "✅ Token actualizado en .env"
echo ""
echo "Verificando conexión..."
python3 test_token.py

echo ""
echo "¿Extraer métricas ahora? (s/n)"
read EXTRACT

if [ "$EXTRACT" = "s" ]; then
    python3 meta_metrics_exporter.py
    echo ""
    echo "✅ ¡Listo! Abre el dashboard: http://localhost:8000"
fi
