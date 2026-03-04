#!/bin/bash

# Script para generar token de Meta de forma fácil e interactiva
# Este script NO comparte tus credenciales con nadie

echo "═══════════════════════════════════════════════════════"
echo "  🔑 GENERADOR DE TOKEN DE META - PASO A PASO"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Este script te ayudará a generar un token de forma segura."
echo "Tus credenciales NUNCA salen de tu computadora."
echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 1: Obtener tu App ID y App Secret"
echo "───────────────────────────────────────────────────────"
echo ""
echo "1. Abre esta URL en tu navegador:"
echo "   👉 https://developers.facebook.com/apps/"
echo ""
echo "2. Click en tu app: 'Bot Access Data'"
echo ""
echo "3. En el menú lateral: 'App Settings' → 'Basic'"
echo ""
echo "4. Copia tu App ID y App Secret"
echo "   (Para ver el App Secret, click en 'Show')"
echo ""

read -p "¿Ya los tienes? (presiona Enter para continuar)" DUMMY

echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 2: Pegar tus credenciales (solo tú las verás)"
echo "───────────────────────────────────────────────────────"
echo ""

read -p "Pega tu App ID: " APP_ID
read -sp "Pega tu App Secret: " APP_SECRET
echo ""

if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
    echo ""
    echo "❌ App ID o App Secret vacío. Intenta de nuevo."
    exit 1
fi

echo ""
echo "✅ Credenciales recibidas"
echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 3: Generar URL de autorización"
echo "───────────────────────────────────────────────────────"
echo ""

# Crear URL de OAuth
REDIRECT_URI="https://localhost/"
SCOPE="ads_read,ads_management,business_management"
AUTH_URL="https://www.facebook.com/v21.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code"

echo "Abre esta URL en tu navegador:"
echo ""
echo "👉 ${AUTH_URL}"
echo ""
echo "Copia la URL completa en tu navegador y pégala aquí:"
echo ""

# Copiar la URL al clipboard (macOS)
echo "$AUTH_URL" | pbcopy
echo "✅ URL copiada al clipboard. Solo pégala en tu navegador (Cmd+V)"
echo ""

read -p "Presiona Enter cuando hayas abierto la URL en tu navegador" DUMMY

echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 4: Autorizar la app"
echo "───────────────────────────────────────────────────────"
echo ""
echo "En el navegador:"
echo "1. Haz login en Facebook si te lo pide"
echo "2. Autoriza los permisos"
echo "3. Te redirigirá a una página que no carga (esto es normal)"
echo "4. COPIA toda la URL de la barra del navegador"
echo "   (Se verá así: https://localhost/?code=AQDxxxxx...)"
echo ""

read -p "Pega la URL completa aquí: " CALLBACK_URL

# Extraer el código
CODE=$(echo "$CALLBACK_URL" | grep -o 'code=[^&]*' | cut -d= -f2)

if [ -z "$CODE" ]; then
    echo ""
    echo "❌ No se pudo extraer el código. Asegúrate de copiar la URL completa."
    exit 1
fi

echo ""
echo "✅ Código extraído: ${CODE:0:20}..."
echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 5: Intercambiar código por token"
echo "───────────────────────────────────────────────────────"
echo ""

# Intercambiar código por token
TOKEN_URL="https://graph.facebook.com/v21.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${APP_SECRET}&code=${CODE}"

echo "Obteniendo token..."
RESPONSE=$(curl -s "$TOKEN_URL")

# Extraer el access token
ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo ""
    echo "❌ Error al obtener token:"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ ¡TOKEN GENERADO EXITOSAMENTE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Tu token es:"
echo "$ACCESS_TOKEN"
echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 6: Guardar en .env"
echo "───────────────────────────────────────────────────────"
echo ""

read -p "¿Quieres guardarlo automáticamente en .env? (s/n): " SAVE

if [ "$SAVE" = "s" ]; then
    # Actualizar .env
    if [ -f ".env" ]; then
        # Backup del .env anterior
        cp .env .env.backup

        # Actualizar la línea del token
        sed -i.bak "s|META_ACCESS_TOKEN=.*|META_ACCESS_TOKEN=${ACCESS_TOKEN}|" .env

        echo ""
        echo "✅ Token guardado en .env"
        echo "   (Backup en .env.backup)"
    else
        echo "❌ No se encontró archivo .env"
        echo "   Crea uno manualmente con:"
        echo "   META_ACCESS_TOKEN=${ACCESS_TOKEN}"
        echo "   META_AD_ACCOUNT_ID=act_655164846858616"
    fi
else
    echo ""
    echo "Copia y pega esto en tu .env:"
    echo ""
    echo "META_ACCESS_TOKEN=${ACCESS_TOKEN}"
    echo ""
fi

echo ""
echo "───────────────────────────────────────────────────────"
echo "  PASO 7: Verificar que funciona"
echo "───────────────────────────────────────────────────────"
echo ""

read -p "¿Quieres probar el token ahora? (s/n): " TEST

if [ "$TEST" = "s" ]; then
    echo ""
    echo "Probando token..."
    python3 test_token.py
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🎉 ¡PROCESO COMPLETADO!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Próximos pasos:"
echo "  1. python3 meta_metrics_exporter.py  (extraer métricas)"
echo "  2. open http://localhost:8000         (ver dashboard)"
echo ""
