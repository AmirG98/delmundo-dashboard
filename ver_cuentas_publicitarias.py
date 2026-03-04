#!/usr/bin/env python3
"""
Script para ver todas las cuentas publicitarias disponibles
y configurar cuál usar en el dashboard
"""

import os
from dotenv import load_dotenv
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.user import User

# Cargar variables de entorno
load_dotenv()

def get_all_ad_accounts():
    """Obtiene todas las cuentas publicitarias del usuario"""
    access_token = os.getenv('META_ACCESS_TOKEN')

    if not access_token:
        print("❌ Error: No se encontró META_ACCESS_TOKEN en .env")
        return None

    try:
        # Inicializar API
        FacebookAdsApi.init(access_token=access_token)

        # Obtener info del usuario actual
        print("🔍 Buscando tus cuentas publicitarias...\n")

        me = User(fbid='me')
        ad_accounts = me.get_ad_accounts(fields=[
            'id',
            'name',
            'account_status',
            'currency',
            'timezone_name',
            'business_name',
            'amount_spent',
        ])

        return list(ad_accounts)

    except Exception as e:
        print(f"❌ Error al obtener cuentas: {str(e)}")

        if "expired" in str(e).lower():
            print("\n⚠️  Tu token expiró. Renuévalo primero:")
            print("   1. Ve a: https://developers.facebook.com/tools/explorer/")
            print("   2. Genera un nuevo token")
            print("   3. Actualiza tu .env")

        return None

def format_currency(amount, currency):
    """Formatea cantidad en la moneda correcta"""
    amount = float(amount) / 100  # Meta devuelve en centavos
    return f"{currency} {amount:,.2f}"

def display_accounts(accounts):
    """Muestra las cuentas en formato bonito"""
    if not accounts:
        print("❌ No se encontraron cuentas publicitarias.")
        return

    print("="*80)
    print(f"  📊 TUS CUENTAS PUBLICITARIAS DE META ({len(accounts)} encontradas)")
    print("="*80 + "\n")

    current_account = os.getenv('META_AD_ACCOUNT_ID')

    for i, account in enumerate(accounts, 1):
        account_id = account.get('id')
        is_current = "✅ ACTUAL" if account_id == current_account else ""

        print(f"[{i}] {account_id} {is_current}")
        print(f"    Nombre: {account.get('name')}")

        if account.get('business_name'):
            print(f"    Business: {account.get('business_name')}")

        status = account.get('account_status')
        status_emoji = "✅" if status == 1 else "⚠️"
        status_text = {
            1: "Active",
            2: "Disabled",
            3: "Unsettled",
            7: "Pending Risk Review",
            8: "Pending Settlement",
            9: "In Grace Period",
            100: "Pending Closure",
            101: "Closed",
            201: "Any Active",
            202: "Any Closed"
        }.get(status, f"Status {status}")

        print(f"    Estado: {status_emoji} {status_text}")
        print(f"    Moneda: {account.get('currency')}")
        print(f"    Timezone: {account.get('timezone_name')}")

        amount_spent = account.get('amount_spent', '0')
        if amount_spent and amount_spent != '0':
            spent = format_currency(amount_spent, account.get('currency'))
            print(f"    Gasto histórico: {spent}")

        print()

    print("="*80 + "\n")

def update_account_in_env(account_id):
    """Actualiza el ID de cuenta en .env"""
    env_path = '.env'

    try:
        # Leer archivo actual
        with open(env_path, 'r') as f:
            lines = f.readlines()

        # Actualizar línea de account ID
        with open(env_path, 'w') as f:
            found = False
            for line in lines:
                if line.startswith('META_AD_ACCOUNT_ID='):
                    f.write(f'META_AD_ACCOUNT_ID={account_id}\n')
                    found = True
                else:
                    f.write(line)

            # Si no existía, agregarlo
            if not found:
                f.write(f'\nMETA_AD_ACCOUNT_ID={account_id}\n')

        print(f"✅ Archivo .env actualizado con cuenta: {account_id}")
        return True

    except Exception as e:
        print(f"❌ Error al actualizar .env: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("  🔍 EXPLORADOR DE CUENTAS PUBLICITARIAS DE META")
    print("="*80 + "\n")

    # Obtener todas las cuentas
    accounts = get_all_ad_accounts()

    if not accounts:
        return

    # Mostrar cuentas
    display_accounts(accounts)

    # Preguntar si quiere cambiar la cuenta
    current_account = os.getenv('META_AD_ACCOUNT_ID')

    if current_account:
        # Buscar el nombre de la cuenta actual
        current_name = None
        for account in accounts:
            if account.get('id') == current_account:
                current_name = account.get('name')
                break

        print(f"📍 Cuenta actual configurada:")
        print(f"   ID: {current_account}")
        if current_name:
            print(f"   Nombre: {current_name}")
        print()

    print("💡 Para cambiar de cuenta:")
    print("   1. Copia el ID de la cuenta que quieres usar (ejemplo: act_XXXXXXXXXX)")
    print("   2. Edita el archivo .env:")
    print("      nano .env")
    print("   3. Cambia la línea META_AD_ACCOUNT_ID=...")
    print("   4. Guarda y ejecuta:")
    print("      python3 meta_metrics_exporter.py")
    print()

    print("🎯 El dashboard mostrará las métricas de la cuenta configurada en .env")
    print()

if __name__ == '__main__':
    main()
