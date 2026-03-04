import axios from "axios";
import { NormalizedMetrics } from "../../../shared/types";

const GOOGLE_ADS_API_VERSION = "v15";

export interface GoogleAdsCredentials {
  accessToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
}

export interface GoogleAdsMetrics {
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
}

export async function fetchGoogleAdsCampaigns(
  credentials: GoogleAdsCredentials
): Promise<GoogleAdsCampaign[]> {
  const { accessToken, developerToken, customerId, loginCustomerId } = credentials;

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `;

  try {
    const response = await axios.post(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
      { query },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          ...(loginCustomerId && { "login-customer-id": loginCustomerId }),
          "Content-Type": "application/json",
        },
      }
    );

    const campaigns: GoogleAdsCampaign[] = [];
    for (const batch of response.data) {
      for (const result of batch.results || []) {
        campaigns.push({
          id: result.campaign.id,
          name: result.campaign.name,
          status: result.campaign.status,
        });
      }
    }
    return campaigns;
  } catch (error: any) {
    console.error("Google Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch Google Ads campaigns: ${error.message}`);
  }
}

export async function fetchGoogleAdsMetrics(
  credentials: GoogleAdsCredentials,
  startDate: string,
  endDate: string
): Promise<GoogleAdsMetrics[]> {
  const { accessToken, developerToken, customerId, loginCustomerId } = credentials;

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status != 'REMOVED'
  `;

  try {
    const response = await axios.post(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
      { query },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          ...(loginCustomerId && { "login-customer-id": loginCustomerId }),
          "Content-Type": "application/json",
        },
      }
    );

    const metrics: GoogleAdsMetrics[] = [];
    for (const batch of response.data) {
      for (const result of batch.results || []) {
        metrics.push({
          campaignId: result.campaign.id,
          campaignName: result.campaign.name,
          date: result.segments.date,
          impressions: parseInt(result.metrics.impressions) || 0,
          clicks: parseInt(result.metrics.clicks) || 0,
          cost: (parseInt(result.metrics.costMicros) || 0) / 1000000,
          conversions: parseFloat(result.metrics.conversions) || 0,
          ctr: parseFloat(result.metrics.ctr) || 0,
          averageCpc: (parseInt(result.metrics.averageCpc) || 0) / 1000000,
        });
      }
    }
    return metrics;
  } catch (error: any) {
    console.error("Google Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch Google Ads metrics: ${error.message}`);
  }
}

export function normalizeGoogleAdsMetrics(metrics: GoogleAdsMetrics[]): NormalizedMetrics {
  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      spend: acc.spend + m.cost,
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
    reach: totals.impressions, // Google Ads doesn't have reach, use impressions
    ctr,
    cpc,
    cpm,
    roas,
  };
}
