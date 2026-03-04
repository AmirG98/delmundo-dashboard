import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("organizations");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona organizaciones, usuarios y funnels</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organizations">Organizaciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <OrganizationsTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="funnels" className="space-y-4">
          <FunnelsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ ORGANIZATIONS TAB ============

function OrganizationsTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: organizations, isLoading, refetch } = trpc.organizations.list.useQuery();

  if (isLoading) {
    return <div className="text-center py-8">Cargando organizaciones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Organizaciones</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Organización
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Organización</DialogTitle>
              <DialogDescription>
                Configura una nueva organización cliente
              </DialogDescription>
            </DialogHeader>
            <CreateOrganizationForm onSuccess={() => { setIsCreateOpen(false); refetch(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {organizations?.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>
                    {org.googleSheetId ? `Sheet ID: ${org.googleSheetId.substring(0, 20)}...` : "Sin Sheet configurado"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: org.primaryColor || '#f97316' }}
                  />
                  <span>Color: {org.primaryColor || '#f97316'}</span>
                </div>
                <div>
                  Estado: {org.isActive ? "✓ Activo" : "✗ Inactivo"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateOrganizationForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [color, setColor] = useState("#f97316");

  const createMutation = trpc.organizations.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setName("");
      setSheetId("");
      setColor("#f97316");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      googleSheetId: sheetId || undefined,
      primaryColor: color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Nombre de Organización</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sheet-id">Google Sheet ID</Label>
        <Input
          id="sheet-id"
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          placeholder="1DDw7kBS828ZQ7kGLMAlgnmuXoHxrvYro9vbsY2LI1dI"
        />
        <p className="text-xs text-muted-foreground">
          El ID se encuentra en la URL del Google Sheet
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color Primario</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-20"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#f97316"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creando..." : "Crear Organización"}
      </Button>
    </form>
  );
}

// ============ USERS TAB ============

function UsersTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();
  const { data: organizations } = trpc.organizations.list.useQuery();

  if (isLoading) {
    return <div className="text-center py-8">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
              <DialogDescription>
                Crea un nuevo usuario y asígnalo a una organización
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm
              organizations={organizations || []}
              onSuccess={() => { setIsCreateOpen(false); refetch(); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{user.name || "Sin nombre"}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>Rol: {user.role === 'admin' ? 'Administrador' : 'Cliente'}</div>
                <div>
                  {user.organizationId ? `Org ID: ${user.organizationId}` : "Sin organización"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateUserForm({ organizations, onSuccess }: {
  organizations: any[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client_user" | "admin">("client_user");
  const [orgId, setOrgId] = useState<number | undefined>();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setName("");
      setEmail("");
      setPassword("");
      setRole("client_user");
      setOrgId(undefined);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      email,
      password,
      role,
      organizationId: orgId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-name">Nombre</Label>
        <Input
          id="user-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan Pérez"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="juan@empresa.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-password">Contraseña</Label>
        <Input
          id="user-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role">Rol</Label>
        <select
          id="user-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "client_user" | "admin")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="client_user">Cliente</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {role === "client_user" && (
        <div className="space-y-2">
          <Label htmlFor="user-org">Organización</Label>
          <select
            id="user-org"
            value={orgId || ""}
            onChange={(e) => setOrgId(e.target.value ? Number(e.target.value) : undefined)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            required
          >
            <option value="">Selecciona una organización</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creando..." : "Crear Usuario"}
      </Button>
    </form>
  );
}

// ============ FUNNELS TAB ============

function FunnelsTab() {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: organizations } = trpc.organizations.list.useQuery();
  const { data: funnels, refetch } = trpc.funnels.list.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: !!selectedOrgId }
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Funnels</h2>
        <div className="flex gap-2">
          <select
            value={selectedOrgId || ""}
            onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : null)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="">Selecciona una organización</option>
            {organizations?.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          {selectedOrgId && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Funnel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Funnel</DialogTitle>
                  <DialogDescription>
                    Configura un nuevo funnel para esta organización
                  </DialogDescription>
                </DialogHeader>
                <CreateFunnelForm
                  organizationId={selectedOrgId}
                  onSuccess={() => { setIsCreateOpen(false); refetch(); }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {selectedOrgId ? (
        <div className="grid gap-4">
          {funnels?.map((funnel) => (
            <Card key={funnel.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{funnel.name}</CardTitle>
                    <CardDescription>
                      {funnel.platform} - Tab: {funnel.sheetTabName}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Orden: {funnel.order} | Estado: {funnel.isActive ? "✓ Activo" : "✗ Inactivo"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Selecciona una organización para ver sus funnels
        </div>
      )}
    </div>
  );
}

function CreateFunnelForm({ organizationId, onSuccess }: {
  organizationId: number;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"google_ads" | "meta_ads" | "linkedin_ads" | "bing_ads" | "hubspot">("google_ads");
  const [tabName, setTabName] = useState("");
  const [order, setOrder] = useState(0);

  const createMutation = trpc.funnels.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setName("");
      setPlatform("google_ads");
      setTabName("");
      setOrder(0);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      organizationId,
      name,
      platform,
      sheetTabName: tabName,
      order,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="funnel-name">Nombre del Funnel</Label>
        <Input
          id="funnel-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Google Search Principal"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="funnel-platform">Plataforma</Label>
        <select
          id="funnel-platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as any)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="google_ads">Google Ads</option>
          <option value="meta_ads">Meta Ads</option>
          <option value="linkedin_ads">LinkedIn Ads</option>
          <option value="bing_ads">Bing Ads</option>
          <option value="hubspot">HubSpot</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="funnel-tab">Nombre del Tab en Sheet</Label>
        <Input
          id="funnel-tab"
          value={tabName}
          onChange={(e) => setTabName(e.target.value)}
          placeholder="SEARCH - Google Ads"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="funnel-order">Orden</Label>
        <Input
          id="funnel-order"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          min={0}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creando..." : "Crear Funnel"}
      </Button>
    </form>
  );
}
