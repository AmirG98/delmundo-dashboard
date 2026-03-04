import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoProvider } from "./contexts/DemoContext";
import { BusinessUnitProvider } from "./contexts/BusinessUnitContext";
import { PasswordAuthProvider, usePasswordAuth } from "./contexts/PasswordAuthContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import Metrics from "./pages/Metrics";
import Insights from "./pages/Insights";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import PasswordLogin from "./pages/PasswordLogin";
import { Loader2 } from "lucide-react";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin" component={Admin} />
        <Route path="/connections" component={Connections} />
        <Route path="/metrics" component={Metrics} />
        <Route path="/insights" component={Insights} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/reports" component={Reports} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AuthenticatedApp() {
  // Try new JWT authentication first
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated with JWT, show login page
  if (!auth.isAuthenticated) {
    return <Login />;
  }

  return (
    <DemoProvider>
      <BusinessUnitProvider>
        <DashboardRouter />
      </BusinessUnitProvider>
    </DemoProvider>
  );
}

// Legacy authentication wrapper (for backward compatibility)
function LegacyAuthenticatedApp() {
  const { isAuthenticated, isLoading, refetch } = usePasswordAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordLogin onSuccess={refetch} />;
  }

  return (
    <DemoProvider>
      <BusinessUnitProvider>
        <DashboardRouter />
      </BusinessUnitProvider>
    </DemoProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <PasswordAuthProvider>
              <AuthenticatedApp />
            </PasswordAuthProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
