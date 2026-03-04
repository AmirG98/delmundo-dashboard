# How to Generate a New Access Token with Ad Permissions

Your current token only has `public_profile` permission. You need `ads_read` and `ads_management` permissions.

## Steps to Get a New Token:

### Method 1: Using Graph API Explorer (Easiest)

1. Go to: https://developers.facebook.com/tools/explorer/

2. In the top right, select your Meta App (or create one if needed)

3. Click "Generate Access Token"

4. In the permissions dialog, add these permissions:
   - `ads_read`
   - `ads_management`
   - `business_management` (optional, for accessing business settings)

5. Click "Generate Access Token"

6. Copy the new token

7. Replace the token in your `.env` file

### Method 2: Using Meta Business Suite

1. Go to: https://business.facebook.com/settings/system-users

2. Create or select a System User

3. Generate a new token with these permissions:
   - `ads_read`
   - `ads_management`

4. Choose a token expiration (60 days or never expire)

5. Copy the token and replace it in your `.env` file

### Method 3: Using Meta for Developers

1. Go to: https://developers.facebook.com/apps/

2. Select or create your app

3. Go to "Tools" → "Graph API Explorer"

4. Select your app and add the required permissions

5. Generate and copy the token

## After Getting the New Token:

1. Update your `.env` file with the new token:
   ```
   META_ACCESS_TOKEN=YOUR_NEW_TOKEN_HERE
   ```

2. Run the test script again:
   ```bash
   python3 test_token.py
   ```

3. You should now see your ad accounts listed!
