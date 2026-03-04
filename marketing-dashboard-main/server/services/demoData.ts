import { Platform } from "../../shared/types";
import { subDays, format, eachDayOfInterval } from "date-fns";

// Business Unit types - 3 main units
export type BusinessUnit = "lemonsuite" | "casetracking" | "lemonflow";
export type AdPlatform = "all" | "google_ads" | "meta_ads" | "linkedin_ads" | "hubspot";

// Demo campaign configurations with business unit assignment
const DEMO_CAMPAIGNS = {
  google_ads: [
    // LemonSuite campaigns (highest spend)
    { id: "ga-001", name: "LemonSuite - Brand Search", budget: 8000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "ga-002", name: "LemonSuite - TimeBilling Features", budget: 5000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "ga-003", name: "LemonSuite - Law Firm Management", budget: 4000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "ga-004", name: "LemonSuite - Partner Program", budget: 3000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    // CaseTracking campaigns
    { id: "ga-005", name: "CaseTracking - Lead Gen", budget: 3500, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "ga-006", name: "CaseTracking - Corporate", budget: 4500, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "ga-007", name: "CaseTracking - Judicial Automation", budget: 2500, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "ga-008", name: "CaseTracking - Enterprise Solutions", budget: 3000, status: "active", businessUnit: "casetracking" as BusinessUnit },
    // LemonFlow campaigns
    { id: "ga-009", name: "LemonFlow - Workflow Automation", budget: 3000, status: "active", businessUnit: "lemonflow" as BusinessUnit },
    { id: "ga-010", name: "LemonFlow - Legal Process Automation", budget: 2500, status: "active", businessUnit: "lemonflow" as BusinessUnit },
    { id: "ga-011", name: "LemonFlow - Integration Partners", budget: 2000, status: "active", businessUnit: "lemonflow" as BusinessUnit },
  ],
  meta_ads: [
    // LemonSuite campaigns
    { id: "ma-001", name: "LemonSuite - Video Testimonials", budget: 6000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "ma-002", name: "LemonSuite - Carousel Features", budget: 4000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "ma-003", name: "LemonSuite - Retargeting", budget: 2500, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    // CaseTracking campaigns
    { id: "ma-004", name: "CaseTracking - Law Firm Retargeting", budget: 3000, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "ma-005", name: "CaseTracking - Enterprise Demo Requests", budget: 3500, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "ma-006", name: "CaseTracking - Brand Awareness", budget: 2000, status: "active", businessUnit: "casetracking" as BusinessUnit },
    // LemonFlow campaigns
    { id: "ma-007", name: "LemonFlow - Automation Demo Videos", budget: 2500, status: "active", businessUnit: "lemonflow" as BusinessUnit },
    { id: "ma-008", name: "LemonFlow - Productivity Stories", budget: 1800, status: "active", businessUnit: "lemonflow" as BusinessUnit },
  ],
  linkedin_ads: [
    // LemonSuite campaigns (B2B focus)
    { id: "li-001", name: "LemonSuite - Partner Program", budget: 5000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "li-002", name: "LemonSuite - Thought Leadership", budget: 3000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "li-003", name: "LemonSuite - Decision Makers", budget: 4000, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    // CaseTracking campaigns
    { id: "li-004", name: "CaseTracking - Legal Tech Decision Makers", budget: 4000, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "li-005", name: "CaseTracking - General Counsel Targeting", budget: 5500, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "li-006", name: "CaseTracking - Enterprise Sales", budget: 3500, status: "active", businessUnit: "casetracking" as BusinessUnit },
    // LemonFlow campaigns
    { id: "li-007", name: "LemonFlow - Operations Directors", budget: 3500, status: "active", businessUnit: "lemonflow" as BusinessUnit },
    { id: "li-008", name: "LemonFlow - Process Improvement Leaders", budget: 2800, status: "active", businessUnit: "lemonflow" as BusinessUnit },
  ],
  hubspot: [
    // LemonSuite campaigns
    { id: "hs-001", name: "LemonSuite - Email Nurture", budget: 800, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "hs-002", name: "LemonSuite - Webinar Series", budget: 1200, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    { id: "hs-003", name: "LemonSuite - Product Updates", budget: 600, status: "active", businessUnit: "lemonsuite" as BusinessUnit },
    // CaseTracking campaigns
    { id: "hs-004", name: "CaseTracking - Demo Request Follow-up", budget: 600, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "hs-005", name: "CaseTracking - Enterprise Onboarding", budget: 900, status: "active", businessUnit: "casetracking" as BusinessUnit },
    { id: "hs-006", name: "CaseTracking - Newsletter", budget: 400, status: "active", businessUnit: "casetracking" as BusinessUnit },
    // LemonFlow campaigns
    { id: "hs-007", name: "LemonFlow - Automation Tips Newsletter", budget: 500, status: "active", businessUnit: "lemonflow" as BusinessUnit },
    { id: "hs-008", name: "LemonFlow - Integration Guides", budget: 400, status: "active", businessUnit: "lemonflow" as BusinessUnit },
  ],
};

// Platform-specific baseline metrics (per $100 spend)
const PLATFORM_BASELINES = {
  google_ads: {
    impressionsPerDollar: 150,
    ctr: 3.5,
    conversionRate: 4.2,
    cpc: 1.20,
  },
  meta_ads: {
    impressionsPerDollar: 250,
    ctr: 1.8,
    conversionRate: 2.8,
    cpc: 0.85,
  },
  linkedin_ads: {
    impressionsPerDollar: 80,
    ctr: 0.8,
    conversionRate: 6.5,
    cpc: 5.50,
  },
  hubspot: {
    impressionsPerDollar: 50,
    ctr: 12.0,
    conversionRate: 8.0,
    cpc: 0.30,
  },
};

// Randomize with variance
function randomize(base: number, variance: number = 0.2): number {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return min + Math.random() * (max - min);
}

// Generate daily trend factor (simulates weekly patterns and growth)
function getDailyTrendFactor(dayOfWeek: number, dayIndex: number, totalDays: number): number {
  // Weekend dip
  const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
  
  // Slight upward trend over time
  const trendFactor = 1 + (dayIndex / totalDays) * 0.15;
  
  // Random daily variation
  const randomFactor = 0.85 + Math.random() * 0.3;
  
  return weekendFactor * trendFactor * randomFactor;
}

export interface DemoMetric {
  platform: Platform;
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  businessUnit: BusinessUnit;
}

export interface DemoConnection {
  id: number;
  platform: Platform;
  accountId: string;
  accountName: string;
  isActive: boolean;
  lastSyncAt: Date;
}

export function generateDemoConnections(): DemoConnection[] {
  return [
    {
      id: 1,
      platform: "google_ads",
      accountId: "demo-123-456-7890",
      accountName: "Lemontech Google Ads",
      isActive: true,
      lastSyncAt: new Date(),
    },
    {
      id: 2,
      platform: "meta_ads",
      accountId: "demo-act_123456789",
      accountName: "Lemontech Meta Business",
      isActive: true,
      lastSyncAt: new Date(),
    },
    {
      id: 3,
      platform: "linkedin_ads",
      accountId: "demo-li-987654321",
      accountName: "Lemontech LinkedIn Ads",
      isActive: true,
      lastSyncAt: new Date(),
    },
    {
      id: 4,
      platform: "hubspot",
      accountId: "demo-hs-112233",
      accountName: "Lemontech HubSpot Portal",
      isActive: true,
      lastSyncAt: new Date(),
    },
  ];
}

export function generateDemoMetrics(
  startDate: Date, 
  endDate: Date,
  businessUnit?: BusinessUnit,
  adPlatform?: AdPlatform
): DemoMetric[] {
  const metrics: DemoMetric[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Determine which platforms to include
  const platformsToInclude = adPlatform && adPlatform !== "all" 
    ? [adPlatform as Platform] 
    : Object.keys(DEMO_CAMPAIGNS) as Platform[];
  
  for (const platform of platformsToInclude) {
    const campaigns = DEMO_CAMPAIGNS[platform];
    const baseline = PLATFORM_BASELINES[platform];
    
    for (const campaign of campaigns) {
      if (campaign.status === "paused") continue;
      
      // Filter by business unit if specified
      if (businessUnit && campaign.businessUnit !== businessUnit) {
        continue;
      }
      
      days.forEach((day, dayIndex) => {
        const dayOfWeek = day.getDay();
        const trendFactor = getDailyTrendFactor(dayOfWeek, dayIndex, days.length);
        
        // Calculate daily budget (monthly budget / 30)
        const dailyBudget = campaign.budget / 30;
        const actualSpend = randomize(dailyBudget * trendFactor, 0.15);
        
        const impressions = Math.round(randomize(actualSpend * baseline.impressionsPerDollar * trendFactor, 0.25));
        const ctr = randomize(baseline.ctr, 0.2);
        const clicks = Math.round(impressions * (ctr / 100));
        const conversionRate = randomize(baseline.conversionRate, 0.3);
        const conversions = Math.round(clicks * (conversionRate / 100));
        const reach = Math.round(impressions * randomize(0.75, 0.1));
        
        const cpc = clicks > 0 ? actualSpend / clicks : 0;
        const cpm = impressions > 0 ? (actualSpend / impressions) * 1000 : 0;
        
        // ROAS calculation (assuming average order value varies by platform)
        const avgOrderValue = platform === "linkedin_ads" ? 500 : platform === "hubspot" ? 200 : 75;
        const revenue = conversions * avgOrderValue * randomize(1, 0.3);
        const roas = actualSpend > 0 ? revenue / actualSpend : 0;
        
        metrics.push({
          platform,
          campaignId: campaign.id,
          campaignName: campaign.name,
          date: format(day, "yyyy-MM-dd"),
          impressions,
          clicks,
          spend: Math.round(actualSpend * 100) / 100,
          conversions,
          reach,
          ctr: Math.round(ctr * 100) / 100,
          cpc: Math.round(cpc * 100) / 100,
          cpm: Math.round(cpm * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          businessUnit: campaign.businessUnit,
        });
      });
    }
  }
  
  return metrics;
}

export interface AggregatedDemoMetrics {
  totals: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  byPlatform: Record<Platform, {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    ctr: number;
    cpc: number;
  }>;
  byBusinessUnit: Record<BusinessUnit, {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
}

export function aggregateDemoMetrics(
  metrics: DemoMetric[],
  businessUnit?: BusinessUnit,
  adPlatform?: AdPlatform
): AggregatedDemoMetrics {
  // Filter metrics by business unit if specified
  let filteredMetrics = metrics;
  if (businessUnit) {
    filteredMetrics = metrics.filter(m => m.businessUnit === businessUnit);
  }
  
  // Filter by ad platform if specified
  if (adPlatform && adPlatform !== "all") {
    filteredMetrics = filteredMetrics.filter(m => m.platform === adPlatform);
  }

  const totals = filteredMetrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      spend: acc.spend + m.spend,
      conversions: acc.conversions + m.conversions,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const byPlatform = {} as AggregatedDemoMetrics["byPlatform"];
  for (const platform of ["google_ads", "meta_ads", "linkedin_ads", "hubspot"] as Platform[]) {
    const platformMetrics = filteredMetrics.filter(m => m.platform === platform);
    const platformTotals = platformMetrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        spend: acc.spend + m.spend,
        conversions: acc.conversions + m.conversions,
      }),
      { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
    );
    byPlatform[platform] = {
      ...platformTotals,
      ctr: platformTotals.impressions > 0 ? (platformTotals.clicks / platformTotals.impressions) * 100 : 0,
      cpc: platformTotals.clicks > 0 ? platformTotals.spend / platformTotals.clicks : 0,
    };
  }

  const byBusinessUnit = {} as AggregatedDemoMetrics["byBusinessUnit"];
  for (const unit of ["lemonsuite", "casetracking", "lemonflow"] as BusinessUnit[]) {
    const unitMetrics = filteredMetrics.filter(m => m.businessUnit === unit);
    byBusinessUnit[unit] = unitMetrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        spend: acc.spend + m.spend,
        conversions: acc.conversions + m.conversions,
      }),
      { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
    );
  }

  return {
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      roas: totals.spend > 0 ? (totals.conversions * 150) / totals.spend : 0, // Assuming avg $150 per conversion
    },
    byPlatform,
    byBusinessUnit,
  };
}

export interface DemoTimeSeries {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export function generateDemoTimeSeries(
  metrics: DemoMetric[],
  businessUnit?: BusinessUnit,
  adPlatform?: AdPlatform
): DemoTimeSeries[] {
  // Filter metrics
  let filteredMetrics = metrics;
  if (businessUnit) {
    filteredMetrics = metrics.filter(m => m.businessUnit === businessUnit);
  }
  if (adPlatform && adPlatform !== "all") {
    filteredMetrics = filteredMetrics.filter(m => m.platform === adPlatform);
  }

  // Group by date
  const byDate = new Map<string, DemoTimeSeries>();
  
  for (const metric of filteredMetrics) {
    const existing = byDate.get(metric.date) || {
      date: metric.date,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
    };
    
    existing.impressions += metric.impressions;
    existing.clicks += metric.clicks;
    existing.spend += metric.spend;
    existing.conversions += metric.conversions;
    
    byDate.set(metric.date, existing);
  }
  
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface DemoInsight {
  id: string;
  summary: string;
  recommendations: string[];
  trends: {
    metric: string;
    direction: "up" | "down" | "stable";
    percentage: number;
    insight: string;
  }[];
  generatedAt: Date;
}

export function generateDemoInsights(businessUnit?: BusinessUnit): DemoInsight {
  const unitName = businessUnit === "lemonsuite" ? "LemonSuite" : 
                   businessUnit === "casetracking" ? "CaseTracking" : 
                   businessUnit === "lemonflow" ? "LemonFlow" :
                   "todas las unidades";
  
  return {
    id: `insight-${Date.now()}`,
    summary: `Análisis de rendimiento para ${unitName}: El gasto publicitario ha aumentado un 12% respecto al mes anterior, con mejoras significativas en CTR de Google Ads (+8%) y conversiones de LinkedIn (+15%). Se recomienda optimizar las campañas de Meta Ads donde el CPC ha aumentado un 5%.`,
    recommendations: [
      `Aumentar presupuesto en LinkedIn Ads para ${unitName} - ROI superior al promedio`,
      "Optimizar creativos de Meta Ads - CTR por debajo del benchmark",
      "Implementar remarketing en Google Ads para usuarios que visitaron pricing",
      "Revisar segmentación de HubSpot - tasa de apertura en descenso",
      "Considerar A/B testing en landing pages de campañas de conversión",
    ],
    trends: [
      {
        metric: "CTR General",
        direction: "up",
        percentage: 8.5,
        insight: "El CTR ha mejorado gracias a la optimización de títulos y descripciones",
      },
      {
        metric: "CPC Promedio",
        direction: "down",
        percentage: 3.2,
        insight: "Reducción de CPC por mejor quality score en Google Ads",
      },
      {
        metric: "Conversiones",
        direction: "up",
        percentage: 15.0,
        insight: "Aumento significativo en conversiones de LinkedIn para B2B",
      },
      {
        metric: "ROAS",
        direction: "stable",
        percentage: 0.5,
        insight: "ROAS estable a pesar del aumento en inversión",
      },
    ],
    generatedAt: new Date(),
  };
}

export interface DemoAlert {
  id: number;
  metricType: string;
  condition: string;
  threshold: number;
  currentValue: number;
  isTriggered: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
}

export function generateDemoAlerts(): DemoAlert[] {
  return [
    {
      id: 1,
      metricType: "daily_spend",
      condition: "greater_than",
      threshold: 5000,
      currentValue: 4850,
      isTriggered: false,
      lastTriggeredAt: null,
      createdAt: subDays(new Date(), 30),
    },
    {
      id: 2,
      metricType: "ctr",
      condition: "less_than",
      threshold: 1.5,
      currentValue: 1.2,
      isTriggered: true,
      lastTriggeredAt: subDays(new Date(), 2),
      createdAt: subDays(new Date(), 45),
    },
    {
      id: 3,
      metricType: "conversions",
      condition: "less_than",
      threshold: 50,
      currentValue: 65,
      isTriggered: false,
      lastTriggeredAt: subDays(new Date(), 15),
      createdAt: subDays(new Date(), 60),
    },
    {
      id: 4,
      metricType: "cpc",
      condition: "greater_than",
      threshold: 3.0,
      currentValue: 2.45,
      isTriggered: false,
      lastTriggeredAt: null,
      createdAt: subDays(new Date(), 20),
    },
  ];
}

export interface DemoReport {
  id: number;
  title: string;
  format: string;
  dateRange: string;
  platforms: string;
  generatedAt: Date;
  fileUrl: string;
}

export function generateDemoReports(): DemoReport[] {
  return [
    {
      id: 1,
      title: "Reporte Mensual - Enero 2026",
      format: "pdf",
      dateRange: "2026-01-01 - 2026-01-31",
      platforms: "Todas",
      generatedAt: subDays(new Date(), 5),
      fileUrl: "#demo-report-1",
    },
    {
      id: 2,
      title: "Análisis Q4 2025 - LemonSuite",
      format: "csv",
      dateRange: "2025-10-01 - 2025-12-31",
      platforms: "Google Ads, Meta Ads",
      generatedAt: subDays(new Date(), 15),
      fileUrl: "#demo-report-2",
    },
    {
      id: 3,
      title: "Comparativa Plataformas - CaseTracking",
      format: "pdf",
      dateRange: "2025-12-01 - 2025-12-31",
      platforms: "Todas",
      generatedAt: subDays(new Date(), 20),
      fileUrl: "#demo-report-3",
    },
    {
      id: 4,
      title: "Performance LemonFlow - Q1 2026",
      format: "pdf",
      dateRange: "2026-01-01 - 2026-01-19",
      platforms: "Google Ads, LinkedIn Ads",
      generatedAt: subDays(new Date(), 3),
      fileUrl: "#demo-report-4",
    },
  ];
}
