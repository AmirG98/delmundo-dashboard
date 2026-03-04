"""
Test script to verify Meta access token and get ad account information
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv('META_ACCESS_TOKEN')

def test_token():
    """Test if the access token is valid"""
    print("Testing access token...")
    print("=" * 80)

    # Get token info
    url = f"https://graph.facebook.com/v24.0/me?access_token={ACCESS_TOKEN}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        print("✓ Token is valid!")
        print(f"User ID: {data.get('id')}")
        print(f"Name: {data.get('name', 'N/A')}")
    else:
        print("✗ Token is invalid or expired")
        print(response.json())
        return False

    print("\n" + "=" * 80)
    print("Fetching ad accounts...")
    print("=" * 80 + "\n")

    # Try to get ad accounts
    url = f"https://graph.facebook.com/v24.0/me?fields=adaccounts{{id,name,account_status,currency}}&access_token={ACCESS_TOKEN}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if 'adaccounts' in data and 'data' in data['adaccounts']:
            accounts = data['adaccounts']['data']
            if accounts:
                print(f"Found {len(accounts)} ad account(s):\n")
                for account in accounts:
                    print(f"Account ID: {account.get('id')}")
                    print(f"Name: {account.get('name')}")
                    print(f"Status: {account.get('account_status', 'N/A')}")
                    print(f"Currency: {account.get('currency', 'N/A')}")
                    print("-" * 80)
                return True
            else:
                print("No ad accounts found for this user.")
        else:
            print("No ad accounts accessible with this token.")
            print("\nYou may need to:")
            print("1. Generate a new token with 'ads_read' and 'ads_management' permissions")
            print("2. Get your ad account ID from Meta Ads Manager")
            print("   - Go to: https://business.facebook.com/settings/ad-accounts")
            print("   - Find your ad account and copy the Account ID")
            print("   - It should look like: act_123456789")
    else:
        print("✗ Error fetching ad accounts:")
        print(response.json())

    return False


def get_debug_token_info():
    """Get detailed token information"""
    print("\n" + "=" * 80)
    print("Token Debug Information")
    print("=" * 80 + "\n")

    url = f"https://graph.facebook.com/v24.0/debug_token?input_token={ACCESS_TOKEN}&access_token={ACCESS_TOKEN}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if 'data' in data:
            token_data = data['data']
            print(f"App ID: {token_data.get('app_id')}")
            print(f"Valid: {token_data.get('is_valid')}")
            print(f"User ID: {token_data.get('user_id')}")

            if 'scopes' in token_data:
                print(f"\nPermissions (Scopes):")
                for scope in token_data['scopes']:
                    print(f"  - {scope}")

            if 'expires_at' in token_data:
                import datetime
                expires = datetime.datetime.fromtimestamp(token_data['expires_at'])
                print(f"\nExpires: {expires}")
            else:
                print("\nExpires: Never (Long-lived token)")
    else:
        print("Could not get token debug information")


if __name__ == "__main__":
    if not ACCESS_TOKEN:
        print("Error: META_ACCESS_TOKEN not found in .env file")
    else:
        test_token()
        get_debug_token_info()

        print("\n" + "=" * 80)
        print("MANUAL METHOD - Get Ad Account ID from Ads Manager:")
        print("=" * 80)
        print("1. Go to: https://business.facebook.com/settings/ad-accounts")
        print("2. Or go to: https://adsmanager.facebook.com/adsmanager/")
        print("3. Click on your account name in the top left")
        print("4. Copy the Account ID (format: act_XXXXXXXXXX)")
        print("5. Add it to .env file: META_AD_ACCOUNT_ID=act_XXXXXXXXXX")
        print("=" * 80)
