import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { 
  FileText, 
  Plus, 
  Download, 
  Calendar,
  Clock,
  FileSpreadsheet,
  File,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { format, subDays, subMonths } from "date-fns";

const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d", getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: "Last 30 days", value: "30d", getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: "Last 90 days", value: "90d", getDates: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: "Last 6 months", value: "6m", getDates: () => ({ start: subMonths(new Date(), 6), end: new Date() }) },
];

interface ReportFormData {
  name: string;
  datePreset: string;
  format: "pdf" | "csv";
}

export default function Reports() {
  const { data: reports, isLoading, refetch } = trpc.reports.list.useQuery();
  
  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: () => {
      toast.success("Report generated successfully");
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate report");
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    name: "",
    datePreset: "30d",
    format: "pdf",
  });

  const handleGenerate = () => {
    const preset = DATE_PRESETS.find(p => p.value === formData.datePreset);
    if (!preset) return;

    const dates = preset.getDates();
    const name = formData.name || `Marketing Report - ${format(dates.start, "MMM d")} to ${format(dates.end, "MMM d, yyyy")}`;

    generateMutation.mutate({
      title: name,
      startDate: format(dates.start, "yyyy-MM-dd"),
      endDate: format(dates.end, "yyyy-MM-dd"),
      format: formData.format,
      platforms: ["google_ads", "meta_ads", "linkedin_ads", "hubspot"],
    });
  };

  const handleDownload = (report: any) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
    } else {
      toast.error("Report file not available");
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <File className="h-4 w-4 text-red-500" />;
      case "csv":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      case "processing":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate and download consolidated performance reports
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </DialogTitle>
              <DialogDescription>
                Create a consolidated report with metrics from all connected platforms.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Name (optional)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Marketing Performance Report"
                />
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select 
                  value={formData.datePreset} 
                  onValueChange={(v) => setFormData({ ...formData, datePreset: v })}
                >
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
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
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select 
                  value={formData.format} 
                  onValueChange={(v) => setFormData({ ...formData, format: v as "pdf" | "csv" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-red-500" />
                        PDF Document
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                        CSV Spreadsheet
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted border-l-2 border-primary text-sm text-muted-foreground">
                <p className="font-medium mb-1">Report includes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Aggregated metrics from all connected platforms</li>
                  <li>Performance trends and comparisons</li>
                  <li>Platform-by-platform breakdown</li>
                  <li>Key insights and recommendations</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">Generated Reports</h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="flex items-center justify-between p-4 border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted">
                    {getFormatIcon(report.format)}
                  </div>
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.dateRangeStart), "MMM d")} - {format(new Date(report.dateRangeEnd), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(report.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {report.fileUrl ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">Processing</Badge>
                  )}
                  {report.fileUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No reports generated yet. Create your first report to share insights with stakeholders.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate First Report
            </Button>
          </div>
        )}
      </Card>

      {/* Report Templates Info */}
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">Report Formats</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <File className="h-6 w-6 text-red-500" />
              <h4 className="font-bold">PDF Document</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional formatted report with charts, tables, and executive summary. 
              Ideal for sharing with stakeholders and management.
            </p>
          </div>
          <div className="p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <FileSpreadsheet className="h-6 w-6 text-green-500" />
              <h4 className="font-bold">CSV Spreadsheet</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Raw data export with all metrics in spreadsheet format. 
              Perfect for further analysis in Excel or Google Sheets.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
