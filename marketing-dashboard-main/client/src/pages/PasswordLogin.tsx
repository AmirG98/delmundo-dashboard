import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Loader2, AlertCircle } from "lucide-react";

interface PasswordLoginProps {
  onSuccess: () => void;
}

export default function PasswordLogin({ onSuccess }: PasswordLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.passwordAuth.login.useMutation({
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lemontech-logo-dark.png" 
              alt="LemonTech" 
              className="h-10 object-contain"
            />
          </div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider">
            Marketing Dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-primary" />
            <h2 className="font-bold uppercase tracking-wider text-sm">
              Acceso Restringido
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Contraseña
              </label>
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
                "Ingresar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Dashboard de métricas publicitarias consolidadas
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-wider">
          © 2026 A+Growth
        </p>
      </div>
    </div>
  );
}
