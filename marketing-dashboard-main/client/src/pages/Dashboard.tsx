import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoMode } from "@/contexts/DemoContext";
import { useBusinessUnit } from "@/contexts/BusinessUnitContext";
import BusinessUnitTabs from "@/components/BusinessUnitTabs";
import { ActionCalendar } from "@/components/ActionCalendar";
import { 
  TrendingUp, 
  TrendingDown, 
  MousePointerClick, 
  DollarSign, 
  Target,
  RefreshCw,
  Calendar,
  ArrowRight,
  FileSpreadsheet,
  Zap,
  Search,
  Building,
  Building2
} from "lucide-react";
import { useState, useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { format, subDays } from "date-fns";
import { useLocation } from "wouter";

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  google_ads: "#4285F4",
  google: "#4285F4",
  meta_ads: "#1877F2",
  meta: "#1877F2",
  linkedin_ads: "#0A66C2",
  linkedin: "#0A66C2",
  hubspot: "#FF7A59",
  bing_ads: "#00897B",
  bing: "#00897B",
};

const PLATFORM_NAMES: Record<string, string> = {
  google_ads: "Google Ads",
  google: "Google Ads",
  meta_ads: "Meta Ads",
  meta: "Meta Ads",
  linkedin_ads: "LinkedIn Ads",
  linkedin: "LinkedIn Ads",
  hubspot: "HubSpot",
  bing_ads: "Bing Ads",
  bing: "Bing Ads",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isDemoMode } = useDemoMode();
  const { businessUnit, adPlatform } = useBusinessUnit();
  const [dateRange] = useState(() => ({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  }));

  // Google Sheets data query (primary data source when not in demo mode)
  const { data: sheetsData, isLoading: sheetsLoading, refetch: refetchSheets } = trpc.sheets.aggregated.useQuery(
    { 
      businessUnit: businessUnit,
      platform: adPlatform === 'all' ? undefined : adPlatform,
    },
    { enabled: !isDemoMode }
  );

  // Google Sheets campaigns
  const { data: sheetsCampaigns } = trpc.sheets.campaigns.useQuery(
    { 
      businessUnit: businessUnit,
      platform: adPlatform === 'all' ? undefined : adPlatform,
    },
    { enabled: !isDemoMode }
  );

  // Demo data queries
  const { data: demoAggregated, isLoading: demoMetricsLoading } = trpc.demo.aggregated.useQuery(
    dateRange,
    { enabled: isDemoMode }
  );
  const { data: demoTimeSeries } = trpc.demo.timeSeries.useQuery(
    dateRange,
    { enabled: isDemoMode }
  );
  const { data: demoInsights } = trpc.demo.insights.useQuery(
    undefined,
    { enabled: isDemoMode }
  );

  // Determine data source
  const hasSheetData = sheetsData?.success && sheetsData.data;
  const isLoadingMetrics = isDemoMode ? demoMetricsLoading : sheetsLoading;

  // Format functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Get metrics based on mode
  const metrics = useMemo(() => {
    if (isDemoMode && demoAggregated) {
      return {
        clicks: demoAggregated.totals.clicks,
        clicksChange: 0,
        cpc: demoAggregated.totals.cpc,
        cpcChange: 0,
        conversions: demoAggregated.totals.conversions,
        conversionsChange: 0,
        spend: demoAggregated.totals.spend,
        impressions: demoAggregated.totals.impressions,
        ctr: demoAggregated.totals.ctr,
        roas: demoAggregated.totals.roas || 0,
        conversionRate: (demoAggregated.totals as any).conversionRate || 0,
      };
    }
    
    if (hasSheetData && sheetsData.data) {
      const data = sheetsData.data;
      return {
        clicks: data.clicks,
        clicksChange: data.clicksChange,
        cpc: data.cpc,
        cpcChange: data.cpcChange,
        conversions: data.conversions,
        conversionsChange: data.conversionsChange,
        spend: data.spend,
        impressions: 0,
        ctr: 0,
        roas: data.conversions > 0 ? (data.conversions * 100) / data.spend : 0,
        conversionRate: data.conversionRate,
        costPerConversion: data.costPerConversion,
        impressionShare: data.impressionShare,
        // Campaign type breakdown
        byType: data.byType,
        // Campaign type AND platform breakdown
        byTypeAndPlatform: data.byTypeAndPlatform,
        // Sub-unit breakdown (CTF vs CTE) for CaseTracking
        bySubUnit: data.bySubUnit,
      };
    }
    
    return null;
  }, [isDemoMode, demoAggregated, hasSheetData, sheetsData]);

  // Get date range display
  const dateRangeDisplay = useMemo(() => {
    if (!isDemoMode && sheetsCampaigns?.dateRange) {
      return sheetsCampaigns.dateRange;
    }
    return "Last 30 days";
  }, [isDemoMode, sheetsCampaigns]);

  // Prepare bar chart data from campaigns
  const barChartData = useMemo(() => {
    if (isDemoMode && demoAggregated?.byPlatform) {
      return Object.entries(demoAggregated.byPlatform).map(([platform, data]) => ({
        platform: PLATFORM_NAMES[platform] || platform,
        platformKey: platform,
        spend: data.spend,
        clicks: data.clicks,
      }));
    }
    
    if (hasSheetData && sheetsData.data?.campaigns) {
      // Group by platform
      const byPlatform: Record<string, { spend: number; clicks: number }> = {};
      for (const campaign of sheetsData.data.campaigns) {
        const platform = campaign.platform;
        if (!byPlatform[platform]) {
          byPlatform[platform] = { spend: 0, clicks: 0 };
        }
        byPlatform[platform].spend += campaign.spend || campaign.cpc * campaign.clicks;
        byPlatform[platform].clicks += campaign.clicks;
      }
      
      return Object.entries(byPlatform).map(([platform, data]) => ({
        platform: PLATFORM_NAMES[platform] || platform,
        platformKey: platform,
        spend: data.spend,
        clicks: data.clicks,
      }));
    }
    
    return [];
  }, [isDemoMode, demoAggregated, hasSheetData, sheetsData]);

  // Prepare time series / campaign performance data
  const timeSeriesData = useMemo(() => {
    if (isDemoMode && demoTimeSeries) {
      return demoTimeSeries.map(d => ({
        name: d.date,
        clicks: d.clicks,
        conversions: d.conversions,
        spend: d.spend,
      }));
    }
    
    if (hasSheetData && sheetsData.data?.campaigns) {
      // Use campaigns as data points
      return sheetsData.data.campaigns.slice(0, 10).map(c => ({
        name: c.campaign.substring(0, 15) + '...',
        clicks: c.clicks,
        conversions: c.conversions,
        spend: c.spend || c.cpc * c.clicks,
      }));
    }
    
    return [];
  }, [isDemoMode, demoTimeSeries, hasSheetData, sheetsData]);

  const isLoading = isLoadingMetrics;

  // Check if we have campaign type breakdown data
  const hasTypeBreakdown = !isDemoMode && hasSheetData && sheetsData.data?.byTypeAndPlatform && 
    (sheetsData.data.byTypeAndPlatform.pmaxGoogle.campaigns.length > 0 || 
     sheetsData.data.byTypeAndPlatform.searchGoogle.campaigns.length > 0 ||
     sheetsData.data.byTypeAndPlatform.searchBing.campaigns.length > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Cross-platform advertising performance overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span className="max-w-[200px] truncate">{dateRangeDisplay}</span>
          </div>
          {!isDemoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSheets()}
              disabled={sheetsLoading}
              className="border-foreground/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sheetsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Business Unit Tabs */}
      <BusinessUnitTabs />

      {/* Data Source Indicator */}
      {!isDemoMode && hasSheetData && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded border border-green-200">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Datos en vivo desde Google Sheets</span>
        </div>
      )}

      {/* No Data State */}
      {!isDemoMode && !hasSheetData && !isLoading && (
        <Card className="p-8 border-2 border-dashed border-border">
          <div className="text-center space-y-4">
            <div className="w-6 h-6 bg-primary mx-auto" />
            <h3 className="text-lg font-bold">No hay datos disponibles</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No se pudieron cargar los datos desde Google Sheets. Verifica que el Sheet esté compartido públicamente.
            </p>
            <Button onClick={() => refetchSheets()} className="mt-4">
              Reintentar
              <RefreshCw className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Total Metrics Grid */}
      {(metrics || isLoading) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Clicks */}
            <Card className="p-4 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CLICKS TOTAL
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{formatNumber(metrics?.clicks || 0)}</p>
                  )}
                </div>
                <div className="p-2 bg-primary/10 rounded">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                </div>
              </div>
              {!isLoading && metrics?.clicksChange !== undefined && metrics.clicksChange !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${metrics.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.clicksChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{metrics.clicksChange >= 0 ? '+' : ''}{metrics.clicksChange.toFixed(1)}% vs anterior</span>
                </div>
              )}
            </Card>

            {/* CPC */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CPC MEDIO
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{formatCurrency(metrics?.cpc || 0)}</p>
                  )}
                </div>
                <div className="p-2 bg-blue-500/10 rounded">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              {!isLoading && metrics?.cpcChange !== undefined && metrics.cpcChange !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${metrics.cpcChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.cpcChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  <span>{metrics.cpcChange >= 0 ? '+' : ''}{metrics.cpcChange.toFixed(1)}% vs anterior</span>
                </div>
              )}
            </Card>

            {/* Conversions */}
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CONVERSIONES
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{formatNumber(metrics?.conversions || 0)}</p>
                  )}
                </div>
                <div className="p-2 bg-green-500/10 rounded">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
              </div>
              {!isLoading && metrics?.conversionsChange !== undefined && metrics.conversionsChange !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${metrics.conversionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.conversionsChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{metrics.conversionsChange >= 0 ? '+' : ''}{metrics.conversionsChange.toFixed(1)}% vs anterior</span>
                </div>
              )}
            </Card>

            {/* Conversion Rate */}
            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    TASA CONV.
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{formatPercent(metrics?.conversionRate || 0)}</p>
                  )}
                </div>
                <div className="p-2 bg-purple-500/10 rounded">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Spend */}
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                GASTO TOTAL
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <p className="text-xl font-bold mt-1">{formatCurrency(metrics?.spend || 0)}</p>
              )}
            </Card>

            {/* Cost per Conversion */}
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                COSTE/CONV.
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <p className="text-xl font-bold mt-1">{formatCurrency(metrics?.costPerConversion || 0)}</p>
              )}
            </Card>

            {/* Impression Share */}
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CUOTA IMPR.
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <p className="text-xl font-bold mt-1">{formatPercent(metrics?.impressionShare || 0)}</p>
              )}
            </Card>


          </div>
        </>
      )}

      {/* Campaign Type Breakdown - Separated by Platform */}
      {hasTypeBreakdown && metrics?.byTypeAndPlatform && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Desglose por Tipo de Campaña</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* PMax Google Campaigns */}
            {metrics.byTypeAndPlatform.pmaxGoogle.campaigns.length > 0 && (
              <Card className="p-6 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded">
                    <Zap className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Performance Max</h3>
                    <p className="text-xs text-muted-foreground">Google Ads • {metrics.byTypeAndPlatform.pmaxGoogle.campaigns.length} campañas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.pmaxGoogle.clicks)}</p>
                    {metrics.byTypeAndPlatform.pmaxGoogle.clicksChange !== 0 && (
                      <p className={`text-xs ${metrics.byTypeAndPlatform.pmaxGoogle.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.byTypeAndPlatform.pmaxGoogle.clicksChange >= 0 ? '+' : ''}{metrics.byTypeAndPlatform.pmaxGoogle.clicksChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.pmaxGoogle.cpc)}</p>
                    {metrics.byTypeAndPlatform.pmaxGoogle.cpcChange !== 0 && (
                      <p className={`text-xs ${metrics.byTypeAndPlatform.pmaxGoogle.cpcChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.byTypeAndPlatform.pmaxGoogle.cpcChange >= 0 ? '+' : ''}{metrics.byTypeAndPlatform.pmaxGoogle.cpcChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Conversiones</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.pmaxGoogle.conversions)}</p>
                    {metrics.byTypeAndPlatform.pmaxGoogle.conversionsChange !== 0 && (
                      <p className={`text-xs ${metrics.byTypeAndPlatform.pmaxGoogle.conversionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.byTypeAndPlatform.pmaxGoogle.conversionsChange >= 0 ? '+' : ''}{metrics.byTypeAndPlatform.pmaxGoogle.conversionsChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.pmaxGoogle.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tasa Conv.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.byTypeAndPlatform.pmaxGoogle.conversionRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Coste/Conv.</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.pmaxGoogle.costPerConversion)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Search Google Campaigns */}
            {metrics.byTypeAndPlatform.searchGoogle.campaigns.length > 0 && (
              <Card className="p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <Search className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Search</h3>
                    <p className="text-xs text-muted-foreground">Google Ads • {metrics.byTypeAndPlatform.searchGoogle.campaigns.length} campañas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.searchGoogle.clicks)}</p>
                    {metrics.byTypeAndPlatform.searchGoogle.clicksChange !== 0 && (
                      <p className={`text-xs ${metrics.byTypeAndPlatform.searchGoogle.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.byTypeAndPlatform.searchGoogle.clicksChange >= 0 ? '+' : ''}{metrics.byTypeAndPlatform.searchGoogle.clicksChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.searchGoogle.cpc)}</p>
                    {metrics.byTypeAndPlatform.searchGoogle.cpcChange !== 0 && (
                      <p className={`text-xs ${metrics.byTypeAndPlatform.searchGoogle.cpcChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.byTypeAndPlatform.searchGoogle.cpcChange >= 0 ? '+' : ''}{metrics.byTypeAndPlatform.searchGoogle.cpcChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Conversiones</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.searchGoogle.conversions)}</p>
                    {metrics.byTypeAndPlatform.searchGoogle.conversionsChange !== 0 && (
                      <p className={`text-xs ${metrics.byTypeAndPlatform.searchGoogle.conversionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.byTypeAndPlatform.searchGoogle.conversionsChange >= 0 ? '+' : ''}{metrics.byTypeAndPlatform.searchGoogle.conversionsChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.searchGoogle.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tasa Conv.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.byTypeAndPlatform.searchGoogle.conversionRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Cuota Impr.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.byTypeAndPlatform.searchGoogle.impressionShare)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Search Bing Campaigns */}
            {metrics.byTypeAndPlatform.searchBing.campaigns.length > 0 && (
              <Card className="p-6 border-l-4 border-l-teal-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-teal-500/10 rounded">
                    <Search className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Search</h3>
                    <p className="text-xs text-muted-foreground">Bing Ads • {metrics.byTypeAndPlatform.searchBing.campaigns.length} campañas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.searchBing.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.searchBing.cpc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Conversiones</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.searchBing.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.searchBing.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tasa Conv.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.byTypeAndPlatform.searchBing.conversionRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Cuota Impr.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.byTypeAndPlatform.searchBing.impressionShare)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Meta y LinkedIn Campaigns */}
            {metrics.byTypeAndPlatform.metaLinkedin.campaigns.length > 0 && (
              <Card className="p-6 border-l-4 border-l-indigo-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded">
                    <Target className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Meta y LinkedIn</h3>
                    <p className="text-xs text-muted-foreground">{metrics.byTypeAndPlatform.metaLinkedin.campaigns.length} campañas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.metaLinkedin.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.metaLinkedin.cpc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Conversiones</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.byTypeAndPlatform.metaLinkedin.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.metaLinkedin.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tasa Conv.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.byTypeAndPlatform.metaLinkedin.conversionRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Coste/Conv.</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.byTypeAndPlatform.metaLinkedin.costPerConversion)}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* CTF vs CTE Breakdown - Only for CaseTracking */}
      {businessUnit === 'casetracking' && metrics?.bySubUnit && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Desglose por Producto</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* CTF - CaseTracking Firms */}
            {metrics.bySubUnit.ctf.campaigns.length > 0 && (
              <Card className="p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/10 rounded">
                    <Building className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">CaseTracking Firms</h3>
                    <p className="text-xs text-muted-foreground">CTF • {metrics.bySubUnit.ctf.campaigns.length} campañas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.bySubUnit.ctf.clicks)}</p>
                    {metrics.bySubUnit.ctf.clicksChange !== 0 && (
                      <p className={`text-xs ${metrics.bySubUnit.ctf.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.bySubUnit.ctf.clicksChange >= 0 ? '+' : ''}{metrics.bySubUnit.ctf.clicksChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.bySubUnit.ctf.cpc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Conversiones</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.bySubUnit.ctf.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.bySubUnit.ctf.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tasa Conv.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.bySubUnit.ctf.conversionRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Coste/Conv.</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.bySubUnit.ctf.costPerConversion)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* CTE - CaseTracking Enterprise */}
            {metrics.bySubUnit.cte.campaigns.length > 0 && (
              <Card className="p-6 border-l-4 border-l-cyan-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded">
                    <Building2 className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">CaseTracking Enterprise</h3>
                    <p className="text-xs text-muted-foreground">CTE • {metrics.bySubUnit.cte.campaigns.length} campañas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.bySubUnit.cte.clicks)}</p>
                    {metrics.bySubUnit.cte.clicksChange !== 0 && (
                      <p className={`text-xs ${metrics.bySubUnit.cte.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.bySubUnit.cte.clicksChange >= 0 ? '+' : ''}{metrics.bySubUnit.cte.clicksChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.bySubUnit.cte.cpc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Conversiones</p>
                    <p className="text-xl font-bold">{formatNumber(metrics.bySubUnit.cte.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.bySubUnit.cte.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tasa Conv.</p>
                    <p className="text-xl font-bold">{formatPercent(metrics.bySubUnit.cte.conversionRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Coste/Conv.</p>
                    <p className="text-xl font-bold">{formatCurrency(metrics.bySubUnit.cte.costPerConversion)}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Action Calendar - Full Width */}
      <ActionCalendar businessUnit={businessUnit} />

      {/* Spend by Platform */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 bg-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">GASTO POR PLATAFORMA</h3>
        </div>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : barChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="spend" name="Gasto">
                {barChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PLATFORM_COLORS[entry.platformKey] || "#FF6B00"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </Card>

      {/* Campaigns Table */}
      {!isDemoMode && hasSheetData && sheetsData.data?.campaigns && sheetsData.data.campaigns.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">CAMPAÑAS</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Campaña</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Clicks</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">CPC</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Conv.</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tasa Conv.</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cambio</th>
                </tr>
              </thead>
              <tbody>
                {sheetsData.data.campaigns.slice(0, 15).map((campaign, index) => {
                  // Check if campaign should be highlighted
                  // List of campaigns to highlight (partial matches supported)
                  const highlightedCampaigns = [
                    // Flow campaigns
                    '[P.MAX][FLOW][CL]_Captación',
                    '[P.MAX][FLOW][CO]_Captación',
                    '[SEARCH][FLOW][CO]_COMPLIANCE',
                    '[BOFU] [P. MAX] [CTE] [CL]',
                    // Suite campaigns  
                    '[SEARCH] [SUITE] [CO] KEYWORDS',
                    '[BOFU] [P. MAX] [CTF] [CL] ABR25',
                  ];
                  // Normalize for comparison: remove special chars, spaces, convert to uppercase
                  const normalizeForMatch = (s: string) => 
                    s.toUpperCase()
                     .replace(/[\[\]\s_\-\.]+/g, '')
                     .replace(/CAPTACION/g, 'CAPTACION')
                     .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
                  const normalizedCampaign = normalizeForMatch(campaign.campaign);
                  const isHighlighted = highlightedCampaigns.some(h => {
                    const normalizedPattern = normalizeForMatch(h);
                    return normalizedCampaign.includes(normalizedPattern) || 
                           normalizedPattern.includes(normalizedCampaign);
                  });
                  return (
                  <tr key={index} className={`border-b border-border/50 hover:bg-muted/50 ${isHighlighted ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
                    <td className="py-3 px-2 font-medium truncate max-w-[200px]" title={campaign.campaign}>
                      {campaign.campaign}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        campaign.campaignType === 'pmax' 
                          ? 'bg-purple-100 text-purple-700' 
                          : campaign.campaignType === 'search'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.campaignType === 'pmax' && <Zap className="h-3 w-3" />}
                        {campaign.campaignType === 'search' && <Search className="h-3 w-3" />}
                        {campaign.campaignType === 'pmax' ? 'PMax' : campaign.campaignType === 'search' ? 'Search' : 'Other'}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">{formatNumber(campaign.clicks)}</td>
                    <td className="text-right py-3 px-2">{formatCurrency(campaign.cpc)}</td>
                    <td className="text-right py-3 px-2">{formatNumber(campaign.conversions)}</td>
                    <td className="text-right py-3 px-2">{formatPercent(campaign.conversionRate)}</td>
                    <td className={`text-right py-3 px-2 ${campaign.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {campaign.clicksChange >= 0 ? '+' : ''}{campaign.clicksChange.toFixed(1)}%
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* AI Insights Preview */}
      {isDemoMode && demoInsights && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary" />
              <h3 className="font-bold uppercase tracking-wider text-sm">AI INSIGHTS</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/insights")}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">{demoInsights.summary}</p>
        </Card>
      )}
    </div>
  );
}
