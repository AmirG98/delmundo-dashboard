#!/usr/bin/env python3
"""
Script Interactivo para Conectar la API de Meta
Ayuda paso a paso para configurar y verificar la conexión
"""

import os
import sys
from datetime import datetime

def print_header():
    print("\n" + "="*60)
    print("  🔌 CONECTAR API DE META - GUÍA INTERACTIVA")
    print("="*60 + "\n")

def check_current_token():
    """Verifica el estado del token actual"""
    print("📋 Paso 1: Verificando token actual...\n")

    from dotenv import load_dotenv
    load_dotenv()

    current_token = os.getenv('META_ACCESS_TOKEN')
    account_id = os.getenv('META_AD_ACCOUNT_ID')

    if not current_token:
        print("❌ No se encontró token en .env")
        return False

    print(f"✅ Token encontrado: {current_token[:20]}...{current_token[-10:]}")
    print(f"✅ Ad Account ID: {account_id}")

    # Intentar usar el token
    print("\n🔍 Probando conexión con Meta API...")
    try:
        from facebook_business.api import FacebookAdsApi
        from facebook_business.adobjects.adaccount import AdAccount

        FacebookAdsApi.init(access_token=current_token)
        account = AdAccount(account_id)

        # Intentar obtener info básica
        account_info = account.api_get(fields=['name', 'currency'])

        print(f"\n✅ ¡CONEXIÓN EXITOSA!")
        print(f"   Account Name: {account_info.get('name')}")
        print(f"   Currency: {account_info.get('currency')}")
        print(f"   Account ID: {account_id}")

        return True

    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR al conectar con Meta API:")
        print(f"   {error_msg}")

        if "expired" in error_msg.lower():
            print("\n⚠️  El token EXPIRÓ. Necesitas renovarlo.")
            return False
        elif "permissions" in error_msg.lower():
            print("\n⚠️  El token no tiene los permisos necesarios.")
            return False
        else:
            print("\n⚠️  Error desconocido.")
            return False

def show_token_instructions():
    """Muestra instrucciones para obtener un nuevo token"""
    print("\n" + "="*60)
    print("📝 CÓMO OBTENER UN NUEVO TOKEN DE META")
    print("="*60 + "\n")

    print("Opción 1: Token Rápido (Expira en 60 días)")
    print("-" * 60)
    print("1️⃣  Abre este link:")
    print("    👉 https://developers.facebook.com/tools/explorer/")
    print()
    print("2️⃣  Arriba a la derecha, selecciona tu 'Meta App'")
    print("    (Si no tienes, crea una en developers.facebook.com/apps)")
    print()
    print("3️⃣  Click en 'Generate Access Token' (botón azul)")
    print()
    print("4️⃣  Selecciona estos permisos:")
    print("    ✅ ads_read")
    print("    ✅ ads_management")
    print("    ✅ business_management")
    print()
    print("5️⃣  Click 'Generate Access Token' y autoriza")
    print()
    print("6️⃣  COPIA el token completo (ejemplo: EAABwz...)")
    print()
    print("\nOpción 2: Token Permanente (No expira, RECOMENDADO)")
    print("-" * 60)
    print("Lee las instrucciones completas en:")
    print("    cat RENOVAR_TOKEN_META.md")
    print()

def update_env_file():
    """Actualiza el archivo .env con un nuevo token"""
    print("\n" + "="*60)
    print("🔧 ACTUALIZAR TOKEN EN .env")
    print("="*60 + "\n")

    print("Por favor, pega tu NUEVO token de Meta:")
    print("(Presiona Ctrl+C para cancelar)\n")

    try:
        new_token = input("Token: ").strip()

        if not new_token:
            print("\n❌ Token vacío. Cancelando...")
            return False

        if len(new_token) < 50:
            print("\n⚠️  El token parece muy corto. ¿Estás seguro?")
            confirm = input("¿Continuar de todos modos? (s/n): ").strip().lower()
            if confirm != 's':
                print("Cancelando...")
                return False

        # Leer el archivo .env actual
        env_path = '.env'
        with open(env_path, 'r') as f:
            lines = f.readlines()

        # Actualizar la línea del token
        with open(env_path, 'w') as f:
            for line in lines:
                if line.startswith('META_ACCESS_TOKEN='):
                    f.write(f'META_ACCESS_TOKEN={new_token}\n')
                else:
                    f.write(line)

        print("\n✅ Token actualizado en .env")

        # Recargar el .env
        from dotenv import load_dotenv
        load_dotenv(override=True)

        return True

    except KeyboardInterrupt:
        print("\n\nCancelado por el usuario.")
        return False
    except Exception as e:
        print(f"\n❌ Error al actualizar .env: {str(e)}")
        return False

def test_new_token():
    """Prueba el nuevo token"""
    print("\n🔍 Probando el nuevo token...")

    return check_current_token()

def extract_metrics():
    """Ejecuta el script de extracción de métricas"""
    print("\n" + "="*60)
    print("📊 EXTRAER MÉTRICAS DE META")
    print("="*60 + "\n")

    print("¿Quieres extraer las métricas ahora? (s/n): ", end='')
    response = input().strip().lower()

    if response == 's':
        print("\n🚀 Ejecutando meta_metrics_exporter.py...\n")
        os.system('python3 meta_metrics_exporter.py')
        return True
    else:
        print("\nPuedes extraer las métricas más tarde con:")
        print("    python3 meta_metrics_exporter.py")
        return False

def main():
    print_header()

    # Paso 1: Verificar token actual
    token_works = check_current_token()

    if token_works:
        print("\n✅ ¡Tu token funciona correctamente!")
        print("\nPuedes extraer métricas con:")
        print("    python3 meta_metrics_exporter.py")

        extract = input("\n¿Extraer métricas ahora? (s/n): ").strip().lower()
        if extract == 's':
            extract_metrics()
        return

    # Paso 2: Si el token no funciona, mostrar instrucciones
    print("\n⚠️  Necesitas renovar tu token de Meta.")

    show_instructions = input("\n¿Ver instrucciones para obtener un nuevo token? (s/n): ").strip().lower()
    if show_instructions == 's':
        show_token_instructions()

    # Paso 3: Actualizar token
    update = input("\n¿Tienes un nuevo token para actualizar? (s/n): ").strip().lower()
    if update == 's':
        if update_env_file():
            # Paso 4: Probar el nuevo token
            if test_new_token():
                # Paso 5: Extraer métricas
                extract_metrics()
    else:
        print("\nPara actualizar el token más tarde, ejecuta:")
        print("    python3 conectar_meta_api.py")

    print("\n" + "="*60)
    print("✨ Proceso completado")
    print("="*60 + "\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelado por el usuario.")
        sys.exit(1)
