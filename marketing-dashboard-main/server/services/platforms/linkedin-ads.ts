import axios from "axios";
import { NormalizedMetrics } from "../../../shared/types";

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

export interface LinkedInAdsCredentials {
  accessToken: string;
  accountId: string;
}

export interface LinkedInAdsCampaign {
  id: string;
  name: string;
  status: string;
  type: string;
}

export interface LinkedInAdsMetrics {
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export async function fetchLinkedInAdAccounts(accessToken: string): Promise<{ id: string; name: string }[]> {
  try {
    const response = await axios.get(`${LINKEDIN_API_URL}/adAccountsV2`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      params: {
        q: "search",
      },
    });

    return response.data.elements.map((account: any) => ({
      id: account.id,
      name: account.name,
    }));
  } catch (error: any) {
    console.error("LinkedIn Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch LinkedIn ad accounts: ${error.message}`);
  }
}

export async function fetchLinkedInAdsCampaigns(
  credentials: LinkedInAdsCredentials
): Promise<LinkedInAdsCampaign[]> {
  const { accessToken, accountId } = credentials;

  try {
    const response = await axios.get(`${LINKEDIN_API_URL}/adCampaignsV2`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      params: {
        q: "search",
        "search.account.values[0]": `urn:li:sponsoredAccount:${accountId}`,
      },
    });

    return response.data.elements.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      type: campaign.type,
    }));
  } catch (error: any) {
    console.error("LinkedIn Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch LinkedIn campaigns: ${error.message}`);
  }
}

export async function fetchLinkedInAdsMetrics(
  credentials: LinkedInAdsCredentials,
  startDate: string,
  endDate: string
): Promise<LinkedInAdsMetrics[]> {
  const { accessToken, accountId } = credentials;

  // Convert dates to LinkedIn format (YYYY-MM-DD to epoch milliseconds)
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  try {
    // First get campaigns
    const campaigns = await fetchLinkedInAdsCampaigns(credentials);
    
    if (campaigns.length === 0) {
      return [];
    }

    const campaignUrns = campaigns.map(c => `urn:li:sponsoredCampaign:${c.id}`);

    const response = await axios.get(`${LINKEDIN_API_URL}/adAnalyticsV2`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      params: {
        q: "analytics",
        pivot: "CAMPAIGN",
        dateRange: JSON.stringify({
          start: { year: new Date(startDate).getFullYear(), month: new Date(startDate).getMonth() + 1, day: new Date(startDate).getDate() },
          end: { year: new Date(endDate).getFullYear(), month: new Date(endDate).getMonth() + 1, day: new Date(endDate).getDate() },
        }),
        timeGranularity: "DAILY",
        campaigns: campaignUrns,
        fields: "impressions,clicks,costInLocalCurrency,externalWebsiteConversions",
      },
    });

    const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

    return response.data.elements.map((element: any) => {
      const campaignId = element.pivotValue?.split(":").pop() || "";
      const impressions = element.impressions || 0;
      const clicks = element.clicks || 0;
      const spend = element.costInLocalCurrency || 0;

      return {
        campaignId,
        campaignName: campaignMap.get(campaignId) || "Unknown",
        date: `${element.dateRange?.start?.year}-${String(element.dateRange?.start?.month).padStart(2, "0")}-${String(element.dateRange?.start?.day).padStart(2, "0")}`,
        impressions,
        clicks,
        spend,
        conversions: element.externalWebsiteConversions || 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
      };
    });
  } catch (error: any) {
    console.error("LinkedIn Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch LinkedIn metrics: ${error.message}`);
  }
}

export function normalizeLinkedInAdsMetrics(metrics: LinkedInAdsMetrics[]): NormalizedMetrics {
  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      spend: acc.spend + m.spend,
      conversions: acc.conversions + m.conversions,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
  const roas = totals.spend > 0 ? totals.conversions / totals.spend : 0;

  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    spend: totals.spend,
    conversions: totals.conversions,
    reach: totals.impressions, // LinkedIn doesn't provide reach
    ctr,
    cpc,
    cpm,
    roas,
  };
}
