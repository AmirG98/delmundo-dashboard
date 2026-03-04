import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Link2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  RefreshCw,
  Lock,
  ShieldAlert,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { PLATFORM_CONFIGS, Platform } from "@shared/types";

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  google_ads: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
    </svg>
  ),
  meta_ads: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin_ads: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  hubspot: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF7A59">
      <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.198 2.198 0 0017.235.838h-.066a2.198 2.198 0 00-2.196 2.196v.066c0 .907.55 1.684 1.335 2.02v2.777a6.233 6.233 0 00-2.88 1.456l-7.453-5.8a2.661 2.661 0 00.105-.726A2.669 2.669 0 003.412 0a2.669 2.669 0 00-.105 5.33c.47 0 .91-.123 1.293-.337l7.344 5.712a6.267 6.267 0 00-.848 3.157 6.267 6.267 0 00.848 3.157l-2.36 1.837a2.198 2.198 0 00-1.335-.453h-.066a2.198 2.198 0 00-2.196 2.196v.066a2.198 2.198 0 002.196 2.196h.066a2.198 2.198 0 002.196-2.196v-.066c0-.168-.02-.331-.056-.488l2.304-1.793a6.267 6.267 0 003.476 1.052 6.283 6.283 0 006.283-6.283 6.283 6.283 0 00-4.308-5.957zm-1.995 9.04a3.083 3.083 0 110-6.166 3.083 3.083 0 010 6.166z"/>
    </svg>
  ),
};

interface ConnectionFormData {
  clientId: string;
  clientSecret: string;
  accountId?: string;
  developerToken?: string;
}

// Password Gate Component
function ConnectionsPasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.connectionsAuth.login.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      setError(err.message || "Contraseña incorrecta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ password });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-4 h-4 bg-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Connections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your advertising accounts to sync metrics
          </p>
        </div>
      </div>

      {/* Password Gate */}
      <Card className="max-w-md mx-auto p-8 border-2 border-dashed border-primary/30">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold">Acceso Restringido</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Esta sección requiere una contraseña de administrador para gestionar las conexiones de plataformas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Contraseña de Administrador
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="pl-10 h-12 border-border focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-3 border border-orange-200">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 uppercase tracking-wider font-bold"
              disabled={loginMutation.isPending || !password}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Acceder"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function Connections() {
  // Check connections auth
  const { data: connectionsAuth, isLoading: authLoading, refetch: refetchAuth } = trpc.connectionsAuth.check.useQuery();
  
  const { data: connections, isLoading, refetch } = trpc.connections.list.useQuery(
    undefined,
    { enabled: connectionsAuth?.authenticated }
  );
  const { data: platformConfigs } = trpc.platformConfigs.list.useQuery(
    undefined,
    { enabled: connectionsAuth?.authenticated }
  );
  
  const getOAuthUrlMutation = trpc.connections.getOAuthUrl.useMutation();
  const disconnectMutation = trpc.connections.disconnect.useMutation();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState<ConnectionFormData>({
    clientId: "",
    clientSecret: "",
    accountId: "",
    developerToken: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Show loading state
  if (authLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!connectionsAuth?.authenticated) {
    return <ConnectionsPasswordGate onSuccess={refetchAuth} />;
  }

  const handleConnect = async () => {
    if (!selectedPlatform || !formData.clientId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { url } = await getOAuthUrlMutation.mutateAsync({
        platform: selectedPlatform,
        clientId: formData.clientId,
      });

      // Store credentials temporarily for the callback
      sessionStorage.setItem(`oauth_${selectedPlatform}`, JSON.stringify({
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        accountId: formData.accountId,
        developerToken: formData.developerToken,
      }));

      // Redirect to OAuth
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate connection");
    }
  };

  const handleDisconnect = async (connectionId: number, platformName: string) => {
    try {
      await disconnectMutation.mutateAsync({ connectionId });
      toast.success(`${platformName} disconnected successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    }
  };

  const getConnectionStatus = (platform: Platform) => {
    if (!connections) return null;
    return connections.find(c => c.platform === platform);
  };

  const platforms: Platform[] = ["google_ads", "meta_ads", "linkedin_ads", "hubspot"];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-4 h-4 bg-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Connections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your advertising accounts to sync metrics
          </p>
        </div>
      </div>

      {/* Admin Access Badge */}
      <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 border border-primary/20 px-4 py-2 w-fit">
        <ShieldAlert className="h-4 w-4" />
        <span className="font-medium uppercase tracking-wider text-xs">Acceso de Administrador Activo</span>
      </div>

      {/* Platforms Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIGS[platform];
          const connection = getConnectionStatus(platform);
          const isConnected = connection?.isActive;

          return (
            <Card key={platform} className="p-6 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted">
                    {PLATFORM_ICONS[platform]}
                  </div>
                  <div>
                    <h3 className="font-bold">{config.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-3 w-3" />
                          Not connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect {config.displayName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the connection and stop syncing metrics from this platform.
                          Historical data will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisconnect(connection.id, config.displayName)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Dialog open={dialogOpen && selectedPlatform === platform} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (open) setSelectedPlatform(platform);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          {PLATFORM_ICONS[platform]}
                          Connect {config.displayName}
                        </DialogTitle>
                        <DialogDescription>
                          Enter your OAuth credentials to connect your {config.displayName} account.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Client ID *</Label>
                          <Input
                            value={formData.clientId}
                            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                            placeholder="Enter Client ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Client Secret *</Label>
                          <Input
                            type="password"
                            value={formData.clientSecret}
                            onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                            placeholder="Enter Client Secret"
                          />
                        </div>
                        {platform === "google_ads" && (
                          <>
                            <div className="space-y-2">
                              <Label>Developer Token</Label>
                              <Input
                                value={formData.developerToken}
                                onChange={(e) => setFormData(prev => ({ ...prev, developerToken: e.target.value }))}
                                placeholder="Enter Developer Token"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Account ID (MCC)</Label>
                              <Input
                                value={formData.accountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                                placeholder="Enter Account ID"
                              />
                            </div>
                          </>
                        )}
                        {(platform === "meta_ads" || platform === "linkedin_ads") && (
                          <div className="space-y-2">
                            <Label>Ad Account ID</Label>
                            <Input
                              value={formData.accountId}
                              onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                              placeholder="Enter Ad Account ID"
                            />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground bg-muted p-3">
                          <p className="font-medium mb-1">How to get credentials:</p>
                          <a 
                            href={config.authUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Visit {config.displayName} Developer Portal
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleConnect}
                          disabled={getOAuthUrlMutation.isPending || !formData.clientId || !formData.clientSecret}
                        >
                          {getOAuthUrlMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                          )}
                          Connect
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {isConnected && connection && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Account</p>
                      <p className="font-medium">{connection.accountName || connection.accountId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Last Sync</p>
                      <p className="font-medium">
                        {connection.lastSyncAt 
                          ? new Date(connection.lastSyncAt).toLocaleDateString()
                          : "Never"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="p-6 border border-border bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="w-3 h-3 bg-primary mt-1" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">About Platform Connections</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Connecting your advertising platforms allows the dashboard to automatically sync campaign metrics,
              generate insights, and provide cross-platform performance comparisons. Your credentials are encrypted
              and stored securely.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
