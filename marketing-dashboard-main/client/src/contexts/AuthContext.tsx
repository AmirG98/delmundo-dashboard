import { createContext, useContext, ReactNode } from "react";
import { trpc } from "../lib/trpc";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "client_user";
  organizationId: number | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refetch: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    refetch,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
