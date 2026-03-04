import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/contexts/DemoContext";
import { toast } from "sonner";
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Lightbulb,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { format, subDays } from "date-fns";

interface TrendData {
  metric: string;
  direction: "up" | "down" | "stable";
  percentChange: number;
  description: string;
}

interface RecommendationData {
  priority: "high" | "medium" | "low";
  platform: string;
  title: string;
  description: string;
  expectedImpact: string;
}

export default function Insights() {
  const { isDemoMode } = useDemoMode();
  const [dateRange] = useState(() => ({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  }));

  // Real data queries
  const { data: latestInsight, isLoading: insightLoading, refetch } = trpc.insights.latest.useQuery(
    undefined,
    { enabled: !isDemoMode }
  );
  const { data: insightHistory } = trpc.insights.list.useQuery(
    { limit: 5 },
    { enabled: !isDemoMode }
  );

  // Demo data queries
  const { data: demoInsights, isLoading: demoInsightLoading } = trpc.demo.insights.useQuery(
    undefined,
    { enabled: isDemoMode }
  );
  
  const generateMutation = trpc.insights.generate.useMutation({
    onSuccess: () => {
      toast.success("New insights generated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate insights");
    },
  });

  const handleGenerateInsights = () => {
    if (isDemoMode) {
      toast.info("Demo mode: Insights are pre-generated with sample data");
      return;
    }
    generateMutation.mutate({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="uppercase text-xs">High Priority</Badge>;
      case "medium":
        return <Badge variant="secondary" className="uppercase text-xs bg-amber-100 text-amber-800">Medium</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-xs">Low</Badge>;
    }
  };

  // Use demo or real data based on mode
  const activeInsight = isDemoMode ? demoInsights : latestInsight;
  const isLoading = isDemoMode ? demoInsightLoading : insightLoading;

  const trends = activeInsight?.trends as TrendData[] | null;
  const recommendations = activeInsight?.recommendations as RecommendationData[] | null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered analysis and recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span>Last 30 days</span>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">Summary</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : activeInsight?.summary ? (
          <p className="text-muted-foreground leading-relaxed">
            {String(activeInsight.summary)}
          </p>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No insights available yet. Click "Generate Insights" to analyze your campaign data.
            </p>
          </div>
        )}
        {((activeInsight as any)?.generatedAt || (activeInsight as any)?.createdAt) && (
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            Generated on {format(new Date((activeInsight as any).generatedAt || (activeInsight as any).createdAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </Card>

      {/* Trends and Recommendations Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trends */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Key Trends</h3>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : trends && trends.length > 0 ? (
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 border-l-2 border-primary">
                  <div className="mt-0.5">
                    {getTrendIcon(trend.direction)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold uppercase text-sm">{trend.metric}</span>
                      <span className={`text-sm font-mono ${
                        trend.direction === "up" ? "text-green-600" : 
                        trend.direction === "down" ? "text-red-600" : 
                        "text-muted-foreground"
                      }`}>
                        {trend.percentChange > 0 ? "+" : ""}{trend.percentChange.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trend data available
            </div>
          )}
        </Card>

        {/* Recommendations */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Recommendations</h3>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-border">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4 mt-1" />
                </div>
              ))}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm">{rec.title}</span>
                    </div>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-muted-foreground">Expected: {rec.expectedImpact}</span>
                  </div>
                  {rec.platform && rec.platform !== "all" && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {rec.platform}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recommendations available
            </div>
          )}
        </Card>
      </div>

      {/* Insight History - only show for real mode */}
      {!isDemoMode && insightHistory && insightHistory.length > 1 && (
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Previous Insights</h3>
          </div>
          <div className="space-y-3">
            {insightHistory.slice(1).map((insight) => (
              <div key={insight.id} className="flex items-start gap-4 p-3 border border-border hover:bg-muted/30 transition-colors">
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(insight.createdAt), "MMM d, yyyy")}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                  {String(insight.summary || "No summary available")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
