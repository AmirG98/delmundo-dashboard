import axios from "axios";
import { NormalizedMetrics } from "../../../shared/types";

const HUBSPOT_API_URL = "https://api.hubapi.com";

export interface HubSpotCredentials {
  accessToken: string;
}

export interface HubSpotContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lifecycleStage: string;
}

export interface HubSpotDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
  createdAt: string;
}

export interface HubSpotCampaign {
  id: string;
  name: string;
  type: string;
}

export interface HubSpotMetrics {
  totalContacts: number;
  newContacts: number;
  totalDeals: number;
  dealsValue: number;
  closedDeals: number;
  closedDealsValue: number;
}

export async function fetchHubSpotContacts(
  credentials: HubSpotCredentials,
  limit: number = 100
): Promise<HubSpotContact[]> {
  const { accessToken } = credentials;

  try {
    const response = await axios.get(`${HUBSPOT_API_URL}/crm/v3/objects/contacts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
        properties: "email,firstname,lastname,createdate,lifecyclestage",
      },
    });

    return response.data.results.map((contact: any) => ({
      id: contact.id,
      email: contact.properties.email || "",
      firstName: contact.properties.firstname || "",
      lastName: contact.properties.lastname || "",
      createdAt: contact.properties.createdate,
      lifecycleStage: contact.properties.lifecyclestage || "",
    }));
  } catch (error: any) {
    console.error("HubSpot API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch HubSpot contacts: ${error.message}`);
  }
}

export async function fetchHubSpotDeals(
  credentials: HubSpotCredentials,
  limit: number = 100
): Promise<HubSpotDeal[]> {
  const { accessToken } = credentials;

  try {
    const response = await axios.get(`${HUBSPOT_API_URL}/crm/v3/objects/deals`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
        properties: "dealname,amount,dealstage,closedate,createdate",
      },
    });

    return response.data.results.map((deal: any) => ({
      id: deal.id,
      name: deal.properties.dealname || "",
      amount: parseFloat(deal.properties.amount) || 0,
      stage: deal.properties.dealstage || "",
      closeDate: deal.properties.closedate || "",
      createdAt: deal.properties.createdate,
    }));
  } catch (error: any) {
    console.error("HubSpot API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch HubSpot deals: ${error.message}`);
  }
}

export async function fetchHubSpotCampaigns(
  credentials: HubSpotCredentials
): Promise<HubSpotCampaign[]> {
  const { accessToken } = credentials;

  try {
    const response = await axios.get(`${HUBSPOT_API_URL}/marketing/v3/campaigns`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data.results?.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type || "unknown",
    })) || [];
  } catch (error: any) {
    // Marketing campaigns API might not be available for all accounts
    console.warn("HubSpot campaigns API error:", error.response?.data || error.message);
    return [];
  }
}

export async function fetchHubSpotMetrics(
  credentials: HubSpotCredentials,
  startDate: string,
  endDate: string
): Promise<HubSpotMetrics> {
  const { accessToken } = credentials;

  try {
    // Fetch contacts created in date range
    const contactsResponse = await axios.post(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`,
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "createdate",
                operator: "GTE",
                value: new Date(startDate).getTime(),
              },
              {
                propertyName: "createdate",
                operator: "LTE",
                value: new Date(endDate).getTime(),
              },
            ],
          },
        ],
        limit: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Fetch deals
    const dealsResponse = await axios.post(
      `${HUBSPOT_API_URL}/crm/v3/objects/deals/search`,
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "createdate",
                operator: "GTE",
                value: new Date(startDate).getTime(),
              },
              {
                propertyName: "createdate",
                operator: "LTE",
                value: new Date(endDate).getTime(),
              },
            ],
          },
        ],
        properties: ["dealname", "amount", "dealstage", "closedate"],
        limit: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const newContacts = contactsResponse.data.total || 0;
    const deals = dealsResponse.data.results || [];
    
    const dealsValue = deals.reduce((sum: number, deal: any) => 
      sum + (parseFloat(deal.properties.amount) || 0), 0);
    
    const closedDeals = deals.filter((deal: any) => 
      deal.properties.dealstage === "closedwon");
    
    const closedDealsValue = closedDeals.reduce((sum: number, deal: any) => 
      sum + (parseFloat(deal.properties.amount) || 0), 0);

    // Get total contacts
    const totalContactsResponse = await axios.get(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 1 },
      }
    );

    return {
      totalContacts: totalContactsResponse.data.total || 0,
      newContacts,
      totalDeals: deals.length,
      dealsValue,
      closedDeals: closedDeals.length,
      closedDealsValue,
    };
  } catch (error: any) {
    console.error("HubSpot API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch HubSpot metrics: ${error.message}`);
  }
}

export function normalizeHubSpotMetrics(metrics: HubSpotMetrics): NormalizedMetrics {
  // HubSpot metrics are different from ad platforms, so we map what we can
  return {
    impressions: 0, // Not applicable
    clicks: 0, // Not applicable
    spend: 0, // Not directly available
    conversions: metrics.closedDeals,
    reach: metrics.totalContacts,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    roas: metrics.closedDealsValue > 0 ? metrics.closedDealsValue : 0,
  };
}
