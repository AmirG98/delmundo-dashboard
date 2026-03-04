import axios from "axios";
import { NormalizedMetrics } from "../../../shared/types";

const META_API_VERSION = "v18.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaAdsCredentials {
  accessToken: string;
  adAccountId: string;
}

export interface MetaAdsCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
}

export interface MetaAdsMetrics {
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  actions: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export async function fetchMetaAdAccounts(accessToken: string): Promise<{ id: string; name: string }[]> {
  try {
    const response = await axios.get(`${META_GRAPH_URL}/me/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: "id,name,account_status",
      },
    });

    return response.data.data
      .filter((account: any) => account.account_status === 1) // Active accounts only
      .map((account: any) => ({
        id: account.id,
        name: account.name,
      }));
  } catch (error: any) {
    console.error("Meta Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch Meta ad accounts: ${error.message}`);
  }
}

export async function fetchMetaAdsCampaigns(
  credentials: MetaAdsCredentials
): Promise<MetaAdsCampaign[]> {
  const { accessToken, adAccountId } = credentials;

  try {
    const response = await axios.get(`${META_GRAPH_URL}/${adAccountId}/campaigns`, {
      params: {
        access_token: accessToken,
        fields: "id,name,status,objective",
        limit: 100,
      },
    });

    return response.data.data.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
    }));
  } catch (error: any) {
    console.error("Meta Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch Meta campaigns: ${error.message}`);
  }
}

export async function fetchMetaAdsMetrics(
  credentials: MetaAdsCredentials,
  startDate: string,
  endDate: string
): Promise<MetaAdsMetrics[]> {
  const { accessToken, adAccountId } = credentials;

  try {
    const response = await axios.get(`${META_GRAPH_URL}/${adAccountId}/insights`, {
      params: {
        access_token: accessToken,
        fields: "campaign_id,campaign_name,impressions,clicks,spend,reach,actions,ctr,cpc,cpm",
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        level: "campaign",
        time_increment: 1,
        limit: 500,
      },
    });

    return response.data.data.map((insight: any) => {
      const conversions = insight.actions?.find((a: any) => 
        a.action_type === "purchase" || a.action_type === "lead" || a.action_type === "complete_registration"
      )?.value || 0;

      return {
        campaignId: insight.campaign_id,
        campaignName: insight.campaign_name,
        date: insight.date_start,
        impressions: parseInt(insight.impressions) || 0,
        clicks: parseInt(insight.clicks) || 0,
        spend: parseFloat(insight.spend) || 0,
        reach: parseInt(insight.reach) || 0,
        actions: parseInt(conversions) || 0,
        ctr: parseFloat(insight.ctr) || 0,
        cpc: parseFloat(insight.cpc) || 0,
        cpm: parseFloat(insight.cpm) || 0,
      };
    });
  } catch (error: any) {
    console.error("Meta Ads API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch Meta metrics: ${error.message}`);
  }
}

export function normalizeMetaAdsMetrics(metrics: MetaAdsMetrics[]): NormalizedMetrics {
  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      spend: acc.spend + m.spend,
      reach: acc.reach + m.reach,
      actions: acc.actions + m.actions,
    }),
    { impressions: 0, clicks: 0, spend: 0, reach: 0, actions: 0 }
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
  const roas = totals.spend > 0 ? totals.actions / totals.spend : 0;

  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    spend: totals.spend,
    conversions: totals.actions,
    reach: totals.reach,
    ctr,
    cpc,
    cpm,
    roas,
  };
}
