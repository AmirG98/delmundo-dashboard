import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Bell, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { PLATFORM_CONFIGS, Platform } from "@shared/types";

const METRIC_OPTIONS = [
  { value: "spend", label: "Spend", unit: "$" },
  { value: "ctr", label: "CTR", unit: "%" },
  { value: "cpc", label: "CPC", unit: "$" },
  { value: "conversions", label: "Conversions", unit: "" },
  { value: "impressions", label: "Impressions", unit: "" },
  { value: "roas", label: "ROAS", unit: "x" },
];

const PLATFORM_OPTIONS = [
  { value: "all", label: "All Platforms" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "linkedin_ads", label: "LinkedIn Ads" },
  { value: "hubspot", label: "HubSpot" },
];

interface AlertFormData {
  platform: string;
  metricType: string;
  condition: "above" | "below";
  threshold: string;
}

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery();
  const { data: alertHistory } = trpc.alerts.history.useQuery({ limit: 20 });
  
  const createMutation = trpc.alerts.create.useMutation({
    onSuccess: () => {
      toast.success("Alert created successfully");
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create alert");
    },
  });

  const updateMutation = trpc.alerts.update.useMutation({
    onSuccess: () => {
      toast.success("Alert updated");
      refetch();
    },
  });

  const deleteMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success("Alert deleted");
      refetch();
    },
  });

  const checkMutation = trpc.alerts.checkAndNotify.useMutation({
    onSuccess: (data) => {
      if (data.triggered > 0) {
        toast.warning(`${data.triggered} alert(s) triggered!`);
      } else {
        toast.success("All metrics within thresholds");
      }
      refetch();
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
    platform: "all",
    metricType: "spend",
    condition: "above",
    threshold: "",
  });

  const handleCreate = () => {
    if (!formData.threshold) {
      toast.error("Please enter a threshold value");
      return;
    }

    createMutation.mutate({
      platform: formData.platform as any,
      metricType: formData.metricType as any,
      condition: formData.condition,
      threshold: parseFloat(formData.threshold),
    });
  };

  const handleToggle = (id: number, isActive: boolean) => {
    updateMutation.mutate({ id, isActive });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const getMetricLabel = (metricType: string) => {
    return METRIC_OPTIONS.find(m => m.value === metricType)?.label || metricType;
  };

  const getMetricUnit = (metricType: string) => {
    return METRIC_OPTIONS.find(m => m.value === metricType)?.unit || "";
  };

  const getPlatformLabel = (platform: string) => {
    if (platform === "all") return "All Platforms";
    return PLATFORM_CONFIGS[platform as Platform]?.displayName || platform;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set up notifications for critical metric thresholds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
          >
            <Bell className={`h-4 w-4 mr-2 ${checkMutation.isPending ? 'animate-pulse' : ''}`} />
            Check Now
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Create Alert
                </DialogTitle>
                <DialogDescription>
                  Set up a notification when a metric crosses your defined threshold.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(v) => setFormData({ ...formData, platform: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select 
                    value={formData.metricType} 
                    onValueChange={(v) => setFormData({ ...formData, metricType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select 
                    value={formData.condition} 
                    onValueChange={(v) => setFormData({ ...formData, condition: v as "above" | "below" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Goes above
                        </div>
                      </SelectItem>
                      <SelectItem value="below">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Falls below
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <div className="flex items-center gap-2">
                    {getMetricUnit(formData.metricType) === "$" && (
                      <span className="text-muted-foreground">$</span>
                    )}
                    <Input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                      placeholder="Enter value"
                    />
                    {getMetricUnit(formData.metricType) && getMetricUnit(formData.metricType) !== "$" && (
                      <span className="text-muted-foreground">{getMetricUnit(formData.metricType)}</span>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Alert"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Alerts */}
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">Active Alerts</h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-center justify-between p-4 border border-border ${
                  alert.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 ${alert.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                    {alert.condition === "above" ? (
                      <TrendingUp className={`h-4 w-4 ${alert.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    ) : (
                      <TrendingDown className={`h-4 w-4 ${alert.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {getMetricLabel(alert.metricType)} {alert.condition === "above" ? ">" : "<"}{" "}
                      {getMetricUnit(alert.metricType) === "$" ? "$" : ""}
                      {alert.threshold}
                      {getMetricUnit(alert.metricType) && getMetricUnit(alert.metricType) !== "$" ? getMetricUnit(alert.metricType) : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getPlatformLabel(alert.platform)}
                      {alert.lastTriggeredAt && (
                        <span className="ml-2">
                          • Last triggered: {format(new Date(alert.lastTriggeredAt), "MMM d, h:mm a")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={alert.isActive}
                    onCheckedChange={(checked) => handleToggle(alert.id, checked)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Alert?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The alert will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(alert.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No alerts configured. Create one to get notified when metrics cross your thresholds.
            </p>
          </div>
        )}
      </Card>

      {/* Alert History */}
      {alertHistory && alertHistory.length > 0 && (
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Alert History</h3>
          </div>
          <div className="space-y-3">
            {alertHistory.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 p-3 border border-border">
                <div className="p-2 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    {entry.notificationSent && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Notified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
