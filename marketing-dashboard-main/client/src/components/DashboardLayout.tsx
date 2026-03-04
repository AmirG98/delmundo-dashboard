import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/useMobile";
import { useDemoMode } from "@/contexts/DemoContext";
import { usePasswordAuth } from "@/contexts/PasswordAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Link2,
  Bell,
  FileText,
  Sparkles,
  BarChart3,
  FlaskConical,
  User,
  Settings
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Link2, label: "Connections", path: "/connections" },
  { icon: BarChart3, label: "Metrics", path: "/metrics" },
  { icon: Sparkles, label: "AI Insights", path: "/insights" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: FileText, label: "Reports", path: "/reports" },
];

const adminMenuItem = { icon: Settings, label: "Admin", path: "/admin" };

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { logout } = usePasswordAuth();
  const auth = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Build menu items based on user role
  const menuItems = auth.isAdmin
    ? [...baseMenuItems, adminMenuItem]
    : baseMenuItems;

  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-border"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center min-w-0">
                  <img 
                    src="/lemontech-logo-dark.png" 
                    alt="LemonTech" 
                    className="h-6 object-contain"
                  />
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-medium ${isActive ? 'bg-primary/10' : ''}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Demo Mode Toggle */}
            {!isCollapsed && (
              <div className="px-3 mt-4">
                <div className="p-3 border border-dashed border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider">Demo Mode</span>
                    </div>
                    <Switch
                      checked={isDemoMode}
                      onCheckedChange={toggleDemoMode}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    {isDemoMode 
                      ? "Viewing sample data. Turn off to use real connections."
                      : "Enable to explore with sample data."}
                  </p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="px-2 mt-4">
                <button
                  onClick={toggleDemoMode}
                  className={`h-10 w-full flex items-center justify-center transition-colors ${isDemoMode ? 'bg-primary/10' : 'hover:bg-accent/50'}`}
                  title={isDemoMode ? "Demo Mode: ON" : "Demo Mode: OFF"}
                >
                  <FlaskConical className={`h-4 w-4 ${isDemoMode ? 'text-primary' : 'text-muted-foreground'}`} />
                </button>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {auth.user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {auth.user?.name || auth.user?.email || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {auth.isAdmin ? "Administrador" : "Cliente"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={toggleDemoMode}
                  className="cursor-pointer"
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  <span>{isDemoMode ? "Disable Demo Mode" : "Enable Demo Mode"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    auth.logout();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border h-14 items-center justify-between bg-background px-2 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 bg-background" />
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary" />
                <span className="tracking-tight text-foreground font-medium">
                  {activeMenuItem?.label ?? "Menu"}
                </span>
              </div>
            </div>
            {isDemoMode && (
              <Badge variant="outline" className="text-xs border-primary text-primary">
                Demo
              </Badge>
            )}
          </div>
        )}
        {/* Demo Mode Banner */}
        {isDemoMode && !isMobile && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Demo Mode Active</span>
              <span className="text-xs text-muted-foreground">— Viewing sample data</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDemoMode}
              className="h-7 text-xs"
            >
              Exit Demo
            </Button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
