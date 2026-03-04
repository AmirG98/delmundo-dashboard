"""
Test access to specific ad account
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv('META_ACCESS_TOKEN')
AD_ACCOUNT_ID = os.getenv('META_AD_ACCOUNT_ID')

print("=" * 80)
print(f"Testing access to ad account: {AD_ACCOUNT_ID}")
print("=" * 80)

# Test 1: Get account info
print("\nTest 1: Fetching account information...")
url = f"https://graph.facebook.com/v24.0/{AD_ACCOUNT_ID}?fields=name,account_status,currency,timezone_name&access_token={ACCESS_TOKEN}"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print("✓ Successfully accessed ad account!")
    print(f"Name: {data.get('name')}")
    print(f"Status: {data.get('account_status')}")
    print(f"Currency: {data.get('currency')}")
    print(f"Timezone: {data.get('timezone_name')}")
else:
    print("✗ Cannot access ad account")
    error = response.json()
    print(f"Error: {error.get('error', {}).get('message')}")
    print(f"\nThis is likely because your token lacks the required permissions.")
    print(f"Current permission: public_profile")
    print(f"Required: ads_read, ads_management")

# Test 2: Get campaigns
print("\n" + "=" * 80)
print("Test 2: Fetching campaigns...")
print("=" * 80)
url = f"https://graph.facebook.com/v24.0/{AD_ACCOUNT_ID}/campaigns?fields=name,status,objective&limit=5&access_token={ACCESS_TOKEN}"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    campaigns = data.get('data', [])
    if campaigns:
        print(f"\n✓ Found {len(campaigns)} campaign(s):")
        for i, campaign in enumerate(campaigns, 1):
            print(f"\n{i}. {campaign.get('name')}")
            print(f"   ID: {campaign.get('id')}")
            print(f"   Status: {campaign.get('status')}")
            print(f"   Objective: {campaign.get('objective')}")
    else:
        print("No campaigns found in this account")
else:
    print("✗ Cannot access campaigns")
    error = response.json()
    print(f"Error: {error.get('error', {}).get('message')}")

print("\n" + "=" * 80)
print("NEXT STEPS:")
print("=" * 80)
print("""
If you see errors above, you need to generate a new access token with proper permissions:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app or create one
3. Click "Generate Access Token"
4. Add these permissions:
   - ads_read
   - ads_management
5. Generate the token
6. Copy it and update .env file

Then run this test again: python3 test_account_access.py
""")
