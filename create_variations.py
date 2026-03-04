"""
Example script to create ad variations
Customize this script with your specific ad variations
"""

from meta_ad_variations import MetaAdVariationsManager

def create_headline_variations():
    """Create multiple ads with different headlines"""
    manager = MetaAdVariationsManager()

    # Original ad ID to create variations from
    ORIGINAL_AD_ID = "YOUR_AD_ID_HERE"

    # Different headline variations to test
    headline_variations = [
        "Shop Now - Limited Time Offer!",
        "Don't Miss Out - Sale Ends Soon",
        "Get Yours Today - While Supplies Last",
        "Exclusive Deal - Save Big Now"
    ]

    created_ads = []

    for i, headline in enumerate(headline_variations, 1):
        try:
            variation = {
                'name': headline,  # This will be the link title
                'message': f"Check out our amazing offer! {headline}"
            }

            new_ad = manager.create_ad_variation(
                original_ad_id=ORIGINAL_AD_ID,
                new_ad_name=f"Headline Test - Variation {i}",
                creative_variations=variation
            )

            created_ads.append(new_ad)
            print(f"✓ Created variation {i}: {headline}")

        except Exception as e:
            print(f"✗ Failed to create variation {i}: {str(e)}")

    return created_ads


def create_description_variations():
    """Create multiple ads with different descriptions"""
    manager = MetaAdVariationsManager()

    ORIGINAL_AD_ID = "YOUR_AD_ID_HERE"

    description_variations = [
        "Free shipping on all orders over $50",
        "30-day money-back guarantee included",
        "Join thousands of satisfied customers",
        "Premium quality at affordable prices"
    ]

    created_ads = []

    for i, description in enumerate(description_variations, 1):
        try:
            variation = {
                'description': description
            }

            new_ad = manager.create_ad_variation(
                original_ad_id=ORIGINAL_AD_ID,
                new_ad_name=f"Description Test - Variation {i}",
                creative_variations=variation
            )

            created_ads.append(new_ad)
            print(f"✓ Created variation {i}: {description}")

        except Exception as e:
            print(f"✗ Failed to create variation {i}: {str(e)}")

    return created_ads


def create_combined_variations():
    """Create ads with both headline and description variations"""
    manager = MetaAdVariationsManager()

    ORIGINAL_AD_ID = "YOUR_AD_ID_HERE"

    variations = [
        {
            'name': 'Summer Sale - Up to 50% Off',
            'message': 'Limited time offer on all summer items',
            'description': 'Free shipping on orders over $50'
        },
        {
            'name': 'New Arrivals - Shop Now',
            'message': 'Discover our latest collection',
            'description': 'Trending styles just added'
        },
        {
            'name': 'Exclusive Member Deals',
            'message': 'Join now for special pricing',
            'description': '30-day money-back guarantee'
        }
    ]

    created_ads = []

    for i, variation in enumerate(variations, 1):
        try:
            new_ad = manager.create_ad_variation(
                original_ad_id=ORIGINAL_AD_ID,
                new_ad_name=f"Combined Test - Variation {i}",
                creative_variations=variation
            )

            created_ads.append(new_ad)
            print(f"✓ Created variation {i}")

        except Exception as e:
            print(f"✗ Failed to create variation {i}: {str(e)}")

    return created_ads


if __name__ == "__main__":
    print("=" * 80)
    print("AD VARIATIONS CREATOR")
    print("=" * 80)
    print("\nThis script will create variations of your existing ads.")
    print("Make sure to update ORIGINAL_AD_ID in the functions above.\n")

    # Uncomment the variation type you want to create:

    # create_headline_variations()
    # create_description_variations()
    # create_combined_variations()

    print("\n" + "=" * 80)
    print("Uncomment one of the functions above to create variations!")
    print("=" * 80)
