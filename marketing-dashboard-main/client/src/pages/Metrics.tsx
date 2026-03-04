import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  BarChart3, 
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { Platform, PLATFORM_CONFIGS } from "@shared/types";
import { useBusinessUnit } from "@/contexts/BusinessUnitContext";
import BusinessUnitTabs from "@/components/BusinessUnitTabs";

const PLATFORM_COLORS: Record<string, string> = {
  google_ads: "#4285F4",
  meta_ads: "#1877F2",
  linkedin_ads: "#0A66C2",
  hubspot: "#FF7A59",
};

const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d", getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: "Last 30 days", value: "30d", getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: "Last 90 days", value: "90d", getDates: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: "Last 6 months", value: "6m", getDates: () => ({ start: subMonths(new Date(), 6), end: new Date() }) },
  { label: "Last year", value: "1y", getDates: () => ({ start: subMonths(new Date(), 12), end: new Date() }) },
];

export default function Metrics() {
  const { businessUnit, adPlatform } = useBusinessUnit();
  const [datePreset, setDatePreset] = useState("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");
  
  const dateRange = useMemo(() => {
    const preset = DATE_PRESETS.find(p => p.value === datePreset);
    if (preset) {
      const dates = preset.getDates();
      return {
        startDate: format(dates.start, "yyyy-MM-dd"),
        endDate: format(dates.end, "yyyy-MM-dd"),
      };
    }
    return {
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    };
  }, [datePreset]);

  const { data: aggregatedMetrics, isLoading: metricsLoading } = trpc.metrics.getAggregated.useQuery(dateRange);
  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.metrics.getTimeSeries.useQuery({
    ...dateRange,
    platform: selectedPlatform === "all" ? undefined : selectedPlatform,
  });
  const { data: connections } = trpc.connections.list.useQuery();

  const refreshMutation = trpc.metrics.refresh.useMutation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const platformDistribution = useMemo(() => {
    if (!aggregatedMetrics?.byPlatform) return [];
    return Object.entries(aggregatedMetrics.byPlatform).map(([platform, metrics]) => ({
      name: PLATFORM_CONFIGS[platform as Platform]?.displayName || platform,
      value: metrics.spend,
      color: PLATFORM_COLORS[platform] || "#888",
    }));
  }, [aggregatedMetrics]);

  const connectedPlatforms = useMemo(() => {
    if (!connections) return [];
    return connections.filter(c => c.isActive).map(c => c.platform);
  }, [connections]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Metrics</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Detailed performance analytics across platforms
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[160px] border-border">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform | "all")}>
            <SelectTrigger className="w-[160px] border-border">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {connectedPlatforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {PLATFORM_CONFIGS[platform]?.displayName || platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate({ platform: selectedPlatform === "all" ? undefined : selectedPlatform })}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Business Unit Tabs */}
      <BusinessUnitTabs />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          label="Total Spend"
          value={aggregatedMetrics?.totals.spend}
          format={formatCurrency}
          loading={metricsLoading}
        />
        <SummaryCard
          label="Impressions"
          value={aggregatedMetrics?.totals.impressions}
          format={formatNumber}
          loading={metricsLoading}
        />
        <SummaryCard
          label="Clicks"
          value={aggregatedMetrics?.totals.clicks}
          format={formatNumber}
          loading={metricsLoading}
        />
        <SummaryCard
          label="CTR"
          value={aggregatedMetrics?.totals.ctr}
          format={(v) => `${v.toFixed(2)}%`}
          loading={metricsLoading}
        />
        <SummaryCard
          label="Conversions"
          value={aggregatedMetrics?.totals.conversions}
          format={formatNumber}
          loading={metricsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spend Over Time */}
        <Card className="lg:col-span-2 p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Spend Over Time</h3>
          </div>
          {timeSeriesLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : timeSeries && timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E53935" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E53935" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    border: "1px solid #000",
                    borderRadius: 0,
                    fontSize: 12
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Spend"]}
                  labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                />
                <Area 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#E53935" 
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </Card>

        {/* Platform Distribution */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Spend Distribution</h3>
          </div>
          {metricsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : platformDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    border: "1px solid #000",
                    borderRadius: 0,
                    fontSize: 12
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No platform data available
            </div>
          )}
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">Performance Metrics</h3>
        </div>
        {timeSeriesLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : timeSeries && timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => format(new Date(value), "MMM d")}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  border: "1px solid #000",
                  borderRadius: 0,
                  fontSize: 12
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="clicks" 
                stroke="#E53935" 
                strokeWidth={2}
                dot={false}
                name="Clicks"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="conversions" 
                stroke="#000" 
                strokeWidth={2}
                dot={false}
                name="Conversions"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="impressions" 
                stroke="#4285F4" 
                strokeWidth={2}
                dot={false}
                name="Impressions"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </Card>

      {/* Platform Breakdown Table */}
      {aggregatedMetrics?.byPlatform && Object.keys(aggregatedMetrics.byPlatform).length > 0 && (
        <Card className="p-6 border border-border overflow-x-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Platform Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="text-left py-3 font-bold uppercase tracking-wider text-xs">Platform</th>
                <th className="text-right py-3 font-bold uppercase tracking-wider text-xs">Impressions</th>
                <th className="text-right py-3 font-bold uppercase tracking-wider text-xs">Clicks</th>
                <th className="text-right py-3 font-bold uppercase tracking-wider text-xs">Spend</th>
                <th className="text-right py-3 font-bold uppercase tracking-wider text-xs">CTR</th>
                <th className="text-right py-3 font-bold uppercase tracking-wider text-xs">CPC</th>
                <th className="text-right py-3 font-bold uppercase tracking-wider text-xs">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(aggregatedMetrics.byPlatform).map(([platform, metrics]) => (
                <tr key={platform} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2" 
                        style={{ backgroundColor: PLATFORM_COLORS[platform] || "#888" }}
                      />
                      {PLATFORM_CONFIGS[platform as Platform]?.displayName || platform}
                    </div>
                  </td>
                  <td className="text-right py-3 font-mono">{formatNumber(metrics.impressions)}</td>
                  <td className="text-right py-3 font-mono">{formatNumber(metrics.clicks)}</td>
                  <td className="text-right py-3 font-mono">{formatCurrency(metrics.spend)}</td>
                  <td className="text-right py-3 font-mono">{metrics.ctr.toFixed(2)}%</td>
                  <td className="text-right py-3 font-mono">{formatCurrency(metrics.cpc)}</td>
                  <td className="text-right py-3 font-mono">{formatNumber(metrics.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value?: number;
  format: (value: number) => string;
  loading?: boolean;
}

function SummaryCard({ label, value, format, loading }: SummaryCardProps) {
  return (
    <Card className="p-4 border border-border">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-2xl font-bold tracking-tight">
          {value !== undefined ? format(value) : "-"}
        </p>
      )}
    </Card>
  );
}
