"""
Meta Marketing API - Ad Variations Generator
This script helps you create and manage ad variations using the Meta Marketing API.
"""

import os
from dotenv import load_dotenv
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.adcreative import AdCreative

# Load environment variables
load_dotenv()

class MetaAdVariationsManager:
    """Manage Meta ad variations through the Marketing API"""

    def __init__(self):
        """Initialize the API connection"""
        self.access_token = os.getenv('META_ACCESS_TOKEN')
        self.ad_account_id = os.getenv('META_AD_ACCOUNT_ID')

        if not self.access_token:
            raise ValueError("META_ACCESS_TOKEN not found in .env file")

        # Initialize the Facebook Ads API
        FacebookAdsApi.init(access_token=self.access_token)
        self.api = FacebookAdsApi.get_default_api()

    def get_ad_accounts(self):
        """Fetch all ad accounts accessible with this token"""
        from facebook_business.adobjects.user import User

        me = User(fbid='me')
        accounts = me.get_ad_accounts(fields=[
            'id',
            'name',
            'account_status',
            'currency'
        ])

        print("\nAvailable Ad Accounts:")
        print("-" * 80)
        for account in accounts:
            print(f"ID: {account['id']}")
            print(f"Name: {account['name']}")
            print(f"Status: {account.get('account_status', 'N/A')}")
            print(f"Currency: {account.get('currency', 'N/A')}")
            print("-" * 80)

        return accounts

    def get_campaigns(self, limit=10):
        """Fetch campaigns from the ad account"""
        if not self.ad_account_id:
            raise ValueError("Please set META_AD_ACCOUNT_ID in .env file")

        account = AdAccount(self.ad_account_id)
        campaigns = account.get_campaigns(fields=[
            'id',
            'name',
            'status',
            'objective',
            'daily_budget',
            'lifetime_budget'
        ], params={'limit': limit})

        print("\nCampaigns:")
        print("-" * 80)
        for campaign in campaigns:
            print(f"ID: {campaign['id']}")
            print(f"Name: {campaign['name']}")
            print(f"Status: {campaign.get('status', 'N/A')}")
            print(f"Objective: {campaign.get('objective', 'N/A')}")
            print("-" * 80)

        return campaigns

    def get_ad_sets(self, campaign_id=None, limit=10):
        """Fetch ad sets from the account or specific campaign"""
        if not self.ad_account_id:
            raise ValueError("Please set META_AD_ACCOUNT_ID in .env file")

        if campaign_id:
            campaign = Campaign(campaign_id)
            ad_sets = campaign.get_ad_sets(fields=[
                'id',
                'name',
                'status',
                'daily_budget',
                'optimization_goal',
                'targeting'
            ], params={'limit': limit})
        else:
            account = AdAccount(self.ad_account_id)
            ad_sets = account.get_ad_sets(fields=[
                'id',
                'name',
                'status',
                'daily_budget',
                'optimization_goal',
                'campaign_id'
            ], params={'limit': limit})

        print("\nAd Sets:")
        print("-" * 80)
        for ad_set in ad_sets:
            print(f"ID: {ad_set['id']}")
            print(f"Name: {ad_set['name']}")
            print(f"Status: {ad_set.get('status', 'N/A')}")
            print(f"Optimization Goal: {ad_set.get('optimization_goal', 'N/A')}")
            print("-" * 80)

        return ad_sets

    def get_ads(self, ad_set_id=None, limit=10):
        """Fetch ads from the account or specific ad set"""
        if not self.ad_account_id:
            raise ValueError("Please set META_AD_ACCOUNT_ID in .env file")

        if ad_set_id:
            ad_set = AdSet(ad_set_id)
            ads = ad_set.get_ads(fields=[
                'id',
                'name',
                'status',
                'creative'
            ], params={'limit': limit})
        else:
            account = AdAccount(self.ad_account_id)
            ads = account.get_ads(fields=[
                'id',
                'name',
                'status',
                'adset_id',
                'creative'
            ], params={'limit': limit})

        print("\nAds:")
        print("-" * 80)
        for ad in ads:
            print(f"ID: {ad['id']}")
            print(f"Name: {ad['name']}")
            print(f"Status: {ad.get('status', 'N/A')}")
            print("-" * 80)

        return ads

    def get_ad_creative(self, ad_id):
        """Fetch the creative details for a specific ad"""
        ad = Ad(ad_id)
        ad_data = ad.api_get(fields=['creative'])

        creative_id = ad_data['creative']['id']
        creative = AdCreative(creative_id)
        creative_data = creative.api_get(fields=[
            'id',
            'name',
            'title',
            'body',
            'image_url',
            'object_story_spec',
            'asset_feed_spec'
        ])

        print("\nAd Creative:")
        print("-" * 80)
        print(f"Creative ID: {creative_data['id']}")
        print(f"Name: {creative_data.get('name', 'N/A')}")
        if 'title' in creative_data:
            print(f"Title: {creative_data['title']}")
        if 'body' in creative_data:
            print(f"Body: {creative_data['body']}")
        print("-" * 80)

        return creative_data

    def create_ad_variation(self, original_ad_id, new_ad_name, creative_variations):
        """
        Create a variation of an existing ad with modified creative elements

        Args:
            original_ad_id: ID of the ad to duplicate
            new_ad_name: Name for the new ad variation
            creative_variations: Dict with creative fields to modify (title, body, etc.)
        """
        # Get original ad details
        original_ad = Ad(original_ad_id)
        original_data = original_ad.api_get(fields=['adset_id', 'creative', 'status'])

        # Get original creative
        original_creative_id = original_data['creative']['id']
        original_creative = AdCreative(original_creative_id)
        original_creative_data = original_creative.api_get(fields=[
            'object_story_spec',
            'asset_feed_spec',
            'name'
        ])

        # Create new creative with variations
        new_creative_data = {
            'name': f"{original_creative_data.get('name', 'Creative')} - Variation",
        }

        # Apply variations to the creative spec
        if 'object_story_spec' in original_creative_data:
            new_creative_data['object_story_spec'] = original_creative_data['object_story_spec']

            # Update with variations
            if 'link_data' in new_creative_data['object_story_spec']:
                link_data = new_creative_data['object_story_spec']['link_data']
                if 'message' in creative_variations:
                    link_data['message'] = creative_variations['message']
                if 'name' in creative_variations:
                    link_data['name'] = creative_variations['name']
                if 'description' in creative_variations:
                    link_data['description'] = creative_variations['description']

        # Create the new creative
        account = AdAccount(self.ad_account_id)
        new_creative = account.create_ad_creative(params=new_creative_data)

        print(f"\nCreated new creative: {new_creative['id']}")

        # Create the new ad
        new_ad_params = {
            'name': new_ad_name,
            'adset_id': original_data['adset_id'],
            'creative': {'creative_id': new_creative['id']},
            'status': 'PAUSED'  # Create as paused for review
        }

        new_ad = account.create_ad(params=new_ad_params)

        print(f"Created new ad variation: {new_ad['id']}")
        print(f"Name: {new_ad_name}")
        print(f"Status: PAUSED (review before activating)")

        return new_ad


def main():
    """Example usage"""
    try:
        manager = MetaAdVariationsManager()

        print("=" * 80)
        print("META MARKETING API - AD VARIATIONS GENERATOR")
        print("=" * 80)

        # Step 1: Get available ad accounts
        print("\nStep 1: Fetching your ad accounts...")
        accounts = manager.get_ad_accounts()

        if accounts:
            print("\n" + "=" * 80)
            print("NEXT STEPS:")
            print("=" * 80)
            print("1. Copy one of the Ad Account IDs above")
            print("2. Add it to your .env file as META_AD_ACCOUNT_ID=act_XXXXXXXXXX")
            print("3. Run this script again to view campaigns and create variations")
            print("=" * 80)

        # If ad account is set, show campaigns
        if manager.ad_account_id:
            print("\nFetching campaigns...")
            campaigns = manager.get_campaigns()

            print("\nFetching ad sets...")
            ad_sets = manager.get_ad_sets()

            print("\nFetching ads...")
            ads = manager.get_ads()

    except Exception as e:
        print(f"\nError: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure your access token is valid")
        print("2. Check that your token has the necessary permissions:")
        print("   - ads_management")
        print("   - ads_read")
        print("3. Verify your ad account ID is correct (format: act_XXXXXXXXXX)")


if __name__ == "__main__":
    main()
