/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Platform types
export type Platform = "google_ads" | "meta_ads" | "linkedin_ads" | "hubspot";

export interface PlatformConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  google_ads: {
    name: "google_ads",
    displayName: "Google Ads",
    icon: "google",
    color: "#4285F4",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
  },
  meta_ads: {
    name: "meta_ads",
    displayName: "Meta Ads",
    icon: "facebook",
    color: "#1877F2",
    scopes: ["ads_read", "ads_management", "business_management"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  },
  linkedin_ads: {
    name: "linkedin_ads",
    displayName: "LinkedIn Ads",
    icon: "linkedin",
    color: "#0A66C2",
    scopes: ["r_ads", "r_ads_reporting", "r_organization_social"],
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  },
  hubspot: {
    name: "hubspot",
    displayName: "HubSpot",
    icon: "hubspot",
    color: "#FF7A59",
    scopes: ["crm.objects.contacts.read", "crm.objects.deals.read", "marketing.campaigns.read"],
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
  },
};

// Metric types
export interface NormalizedMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

export interface PlatformMetrics extends NormalizedMetrics {
  platform: Platform;
  date: string;
  campaignId?: string;
  campaignName?: string;
}

export interface AggregatedMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalReach: number;
  avgCtr: number;
  avgCpc: number;
  avgCpm: number;
  avgRoas: number;
}

export interface DateRangeMetrics {
  date: string;
  metrics: NormalizedMetrics;
  byPlatform: Record<Platform, NormalizedMetrics>;
}

// Alert types
export type MetricType = "spend" | "ctr" | "cpc" | "conversions" | "impressions" | "roas";
export type AlertCondition = "above" | "below";

export interface AlertThreshold {
  metricType: MetricType;
  condition: AlertCondition;
  threshold: number;
  platform: Platform | "all";
}

// Report types
export type ReportFormat = "pdf" | "csv";

export interface ReportConfig {
  title: string;
  format: ReportFormat;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  platforms: Platform[];
  includeInsights: boolean;
}

// AI Insight types
export interface TrendAnalysis {
  metric: MetricType;
  direction: "up" | "down" | "stable";
  percentChange: number;
  description: string;
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  platform: Platform | "all";
  title: string;
  description: string;
  expectedImpact: string;
}

export interface InsightSummary {
  summary: string;
  trends: TrendAnalysis[];
  recommendations: Recommendation[];
  generatedAt: Date;
}

// OAuth state
export interface OAuthState {
  platform: Platform;
  userId: number;
  redirectUrl: string;
  timestamp: number;
}
