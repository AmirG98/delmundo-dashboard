"""
Quick Start - Get your Ad Account ID and start creating variations
This script helps you find your ad account ID and test the API
"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("META MARKETING API - QUICK START GUIDE")
print("=" * 80)

print("\nYour current token permissions: public_profile")
print("Required permissions: ads_read, ads_management")

print("\n" + "=" * 80)
print("STEP 1: Get Your Ad Account ID")
print("=" * 80)

print("""
To get your Ad Account ID:

1. Open Meta Ads Manager: https://adsmanager.facebook.com/

2. Look at the URL in your browser. It will look like:
   https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=123456789...

3. The number after 'act=' is your ad account ID

4. Your full Ad Account ID should be formatted as: act_123456789

5. OR click on the menu (hamburger icon) → Settings
   Your Account ID will be displayed there

""")

print("=" * 80)
print("STEP 2: Add Ad Account ID to .env file")
print("=" * 80)

ad_account_id = os.getenv('META_AD_ACCOUNT_ID')

if ad_account_id:
    print(f"\n✓ Ad Account ID found in .env: {ad_account_id}")
else:
    print("""
Open the .env file and add your Ad Account ID:

META_AD_ACCOUNT_ID=act_XXXXXXXXXX

(Replace XXXXXXXXXX with your actual account ID)
""")

print("\n" + "=" * 80)
print("STEP 3: Get a New Access Token with Proper Permissions")
print("=" * 80)

print("""
Your current token doesn't have the necessary permissions.
Please follow the instructions in GET_NEW_TOKEN.md to generate
a new token with ads_read and ads_management permissions.

Quick link to Graph API Explorer:
https://developers.facebook.com/tools/explorer/

After generating a new token, replace it in the .env file.
""")

print("=" * 80)
print("STEP 4: Test Your Setup")
print("=" * 80)

print("""
After updating your token and ad account ID, run:

    python3 test_token.py

This will verify your token has the correct permissions and can
access your ad account.
""")

print("=" * 80)
print("STEP 5: View Your Ads and Create Variations")
print("=" * 80)

print("""
Once your setup is complete:

1. View your campaigns and ads:
    python3 meta_ad_variations.py

2. Create ad variations:
    - Edit create_variations.py
    - Replace YOUR_AD_ID_HERE with an actual ad ID
    - Customize your variations
    - Run: python3 create_variations.py
""")

print("=" * 80)
