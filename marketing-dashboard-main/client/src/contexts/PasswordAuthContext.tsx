import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface PasswordAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refetch: () => void;
}

const PasswordAuthContext = createContext<PasswordAuthContextType | null>(null);

export function PasswordAuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.passwordAuth.check.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.passwordAuth.logout.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <PasswordAuthContext.Provider
      value={{
        isAuthenticated: data?.authenticated ?? false,
        isLoading,
        logout,
        refetch,
      }}
    >
      {children}
    </PasswordAuthContext.Provider>
  );
}

export function usePasswordAuth() {
  const context = useContext(PasswordAuthContext);
  if (!context) {
    throw new Error("usePasswordAuth must be used within a PasswordAuthProvider");
  }
  return context;
}
