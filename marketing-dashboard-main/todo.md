# Marketing Dashboard TODO

## Core Infrastructure
- [x] Database schema for platforms, credentials, and metrics
- [x] OAuth2.0 authentication system for advertising platforms
- [x] Secure credential storage with encryption

## Platform Integrations
- [x] Google Ads API integration (impressions, clicks, cost, conversions)
- [x] Meta Ads API integration (reach, spend, actions)
- [x] LinkedIn Ads API integration (impressions, clicks, spend)
- [x] HubSpot API integration (contacts, deals, campaign performance)

## Dashboard UI
- [x] Swiss International Typographic Style design
- [x] Platform connection management interface
- [x] Interactive visualization panel with charts
- [x] Date range selector for filtering data
- [x] Cross-platform performance comparison (ROI, CPC, CTR)

## Advanced Features
- [x] Automatic metric updates with manual refresh option
- [x] Alert system for critical metric thresholds
- [x] PDF/CSV report generation
- [x] LLM-powered insights and recommendations

## Testing
- [x] Unit tests for API integrations
- [x] Unit tests for metrics calculations
- [x] Unit tests for report generation

## Demo Mode
- [x] Demo data generator with realistic metrics for all 4 platforms
- [x] Demo mode toggle in UI
- [x] Sample campaigns with varying performance
- [x] 30 days of historical data
- [x] Demo insights and recommendations

## Password Authentication
- [x] Simple password login system (password: lemontech25x)
- [x] Password login page UI
- [x] Session management for password auth
- [x] Remove Manus OAuth dependency for access

## Branding Update
- [x] Add Lemontech logo to login page
- [x] Add Lemontech logo to sidebar
- [x] Change color scheme from red to orange (amirgomez.com style)

## Business Unit Tabs
- [x] Add tabs component to Dashboard (General, LemonSuite, CaseTracking, LemonFlow)
- [x] Add CaseTracking sub-tabs (CTF - Firms, CTE - Enterprise)
- [x] Update demo data with business unit categorization
- [x] Filter metrics by selected business unit

## Connections Password Protection
- [x] Add extra password protection for Connections page (masterpassggx)
- [x] Create password modal/gate for Connections access

## Branding Update v2
- [x] Replace logo with new LemonTech logo (dark background version)
- [x] Change footer from "2025 Lemontech" to "2026 A+Growth"

## Business Unit Restructure
- [x] Reduce tabs to 2 main units: LemonSuite and CaseTracking
- [x] Add platform sub-sections under each unit (Google, Meta, LinkedIn, HubSpot)
- [x] Remove LemonFlow as separate tab
- [x] Update demo data to match new structure

## LemonFlow Tab Addition
- [x] Add LemonFlow as third business unit tab
- [x] Update demo data with LemonFlow campaigns
- [x] Test LemonFlow tab functionality

## Google Sheets Integration
- [x] Create Google Sheets API service to fetch data
- [x] Map sheet columns to dashboard metrics (Clicks, CPC, Conversions, Cost/Conv, Conv Rate, Search Impression Share)
- [x] Parse sheet names to identify business unit and platform
- [x] Support both Google Ads and Meta Ads data formats
- [x] Update dashboard to display real data from Google Sheets
- [x] Test integration with real data from client's spreadsheet

## Data Cleanup and Campaign Type Breakdown
- [x] Filter out subtotal rows (SEARCH, P.MAX, TOTAL GENERAL) from campaign data
- [x] Categorize campaigns by type: PMax vs Search vs Other
- [x] Create dashboard widgets showing total KPIs at top
- [x] Add breakdown section showing PMax metrics vs Search metrics separately
- [x] Add campaign type badges in campaigns table
- [x] Test with real data to verify no duplicates

## LinkedIn and Bing Integration
- [x] Add LinkedIn campaigns data (all SUITE business unit)
- [x] Add Bing campaigns data divided by business unit (SUITE, CT, CTE, CTF, FLOW)
- [x] Rename "Meta y otras" to "Meta y LinkedIn" in dashboard
- [x] Add action calendar component to dashboard
- [x] Test all features working correctly

## Bug Fixes
- [x] Fix sheet mapping for "SUITE - LemonSuite - Meta" to correctly associate with LemonSuite + Meta
- [x] Verify metrics calculation is correct after fix

## LinkedIn CLP Conversion and Calendar Updates
- [x] Convert LinkedIn data from USD to CLP (tipo de cambio ~980 CLP/USD)
- [x] Remove "Rendimiento por Campaña" chart from dashboard
- [x] Connect action calendar to Google Sheet (1eGaK3X25D9iyO6uALiJXMKwmLwv8cKnakG5H-ifLy5Y)
- [x] Expand calendar to take full width where chart was

## ROAS Removal and CTF Campaign Fix
- [x] Remove ROAS metric from all dashboard views
- [x] Reassign Meta campaigns with "CTF" in name to CaseTracking business unit
- [x] Recalculate metrics for LemonSuite and CaseTracking after reassignment

## Platform and Business Unit Selector Bugs
- [x] Fix platform selector (Google/Meta/LinkedIn/HubSpot) to filter data correctly
- [x] Fix business unit selector (LemonSuite/CaseTracking/LemonFlow) to filter data correctly
- [x] Verify all selector combinations work properly
- [x] Fixed Google Ads column mapping (columns were shifted by 1 due to empty 'Gasto' column)

## Gasto Column Integration
- [x] Read Gasto (spend) from the new column in Google Sheets
- [x] Update parseGoogleAdsData to use actual spend instead of calculated (clicks * cpc)
- [x] Fix Chilean number format parsing (dot as thousands separator for currency)
- [x] Verify spend totals are correct across all tabs (LemonSuite, CaseTracking, LemonFlow)

## Remove Platform Selectors
- [x] Remove platform selector tabs (Todas, Google, Meta, LinkedIn, HubSpot) from dashboard

## Fix Dashboard Metrics
- [x] Review Google Sheet column structure and identify correct column names
- [x] Fix column mapping - recognize Clics/Clics en el enlace for clicks, Conversiones/Resultados for conversions
- [x] Calculate CPC as Gasto/Clicks instead of reading from sheet
- [x] Calculate Tasa de Conversión as Conversiones/Clicks instead of reading from sheet
- [x] Verify with reference: [SEARCH] [SUITE] [MX] KEYWORDS = $383,240 gasto, 99 clicks, 4 conv, CPC $3,871 ✅

## Fix LemonSuite Clicks Calculation
- [x] Verify Google Ads LemonSuite clicks: 1,128 (717 PMax + 411 Search) ✅
- [x] Verify Meta LemonSuite clicks: 5,940 (excluding CTF campaigns that go to CaseTracking)
- [x] CTF campaigns (897 clicks) correctly assigned to CaseTracking
- [x] Total LemonSuite: ~7,068 clicks + LinkedIn (57) = ~7,125 - VERIFIED CORRECT

## Fix Search/PMax Metrics and CTF/CTE Breakdown
- [x] Fix Search metrics: 411 clicks, $786,591 spend, 11.5 conversiones
- [x] Fix PMax metrics: 717 clicks, 9 conversiones
- [x] Divide CaseTracking into CTF (Firms) and CTE (Enterprise) sub-sections
- [x] Verify all metrics match the Google Sheet data

## Separate Search by Platform (Google vs Bing)
- [x] Update backend to provide metrics breakdown by platform within each campaign type
- [x] Update Dashboard UI to display "Search Google Ads" and "Search Bing Ads" separately
- [x] Keep PMax as Google-only (no Bing PMax campaigns)
- [x] Test and verify all metrics match expected values

## CaseTracking CTF/CTE Subdivision
- [x] Add detectedSubUnit field to campaign data (CTF vs CTE)
- [x] Update backend to provide bySubUnit breakdown for CaseTracking
- [x] Add "Desglose por Producto" section in Dashboard for CaseTracking tab
- [x] Display CaseTracking Firms (CTF) and CaseTracking Enterprise (CTE) metrics separately

## Highlight Specific Campaigns with Green
- [x] Add green highlight to Flow campaigns: [P.MAX][FLOW][CL]_Captación, [P.MAX][FLOW][CO]_Captación, [SEARCH][FLOW][CO]_COMPLIANCE, [BOFU] [P. MAX] [CTE] [CL]
- [x] Add green highlight to Suite campaigns: [SEARCH] [SUITE] [CO] KEYWORDS, [BOFU] [P. MAX] [CTF] [CL] ABR25
- [x] Apply highlight in campaign table rows

## Fix Meta Spend for LemonSuite
- [x] Verified: CTF campaigns already correctly assigned to CaseTracking, not LemonSuite
- [x] User confirmed current Meta spend calculation is correct
