# Meta Marketing API - Ad Variations Generator

This tool helps you automatically generate ad variations using the Meta Marketing API.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Your Access Token

Your access token is already added to the `.env` file. You just need to add your Ad Account ID.

### 3. Get Your Ad Account ID

Run the main script to see your available ad accounts:

```bash
python meta_ad_variations.py
```

This will display all ad accounts you have access to. Copy the Ad Account ID (format: `act_XXXXXXXXXX`) and add it to your `.env` file:

```
META_AD_ACCOUNT_ID=act_XXXXXXXXXX
```

## Usage

### View Your Campaigns, Ad Sets, and Ads

```bash
python meta_ad_variations.py
```

This will show you all your campaigns, ad sets, and ads.

### Create Ad Variations

1. Open `create_variations.py`
2. Replace `YOUR_AD_ID_HERE` with an actual ad ID from your account
3. Customize the variations (headlines, descriptions, messages)
4. Run the script:

```bash
python create_variations.py
```

### Create Custom Variations

You can use the `MetaAdVariationsManager` class directly:

```python
from meta_ad_variations import MetaAdVariationsManager

manager = MetaAdVariationsManager()

# Create a variation
new_ad = manager.create_ad_variation(
    original_ad_id="YOUR_AD_ID",
    new_ad_name="Test Variation 1",
    creative_variations={
        'name': 'Your Headline Here',
        'message': 'Your primary text here',
        'description': 'Your description here'
    }
)
```

## Available Methods

- `get_ad_accounts()` - List all accessible ad accounts
- `get_campaigns()` - List all campaigns
- `get_ad_sets()` - List all ad sets
- `get_ads()` - List all ads
- `get_ad_creative(ad_id)` - Get creative details for a specific ad
- `create_ad_variation(original_ad_id, new_ad_name, creative_variations)` - Create a new ad variation

## Security Note

Your access token is stored in the `.env` file. Keep this file secure and never commit it to version control.

## Troubleshooting

If you encounter errors:

1. Verify your access token is valid and hasn't expired
2. Check that your token has these permissions:
   - `ads_management`
   - `ads_read`
3. Ensure your ad account ID is in the correct format: `act_XXXXXXXXXX`
4. Make sure the ad IDs you're using exist and you have permission to access them
