import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface ConnectionsAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => void;
}

const ConnectionsAuthContext = createContext<ConnectionsAuthContextType | undefined>(undefined);

export function ConnectionsAuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.connectionsAuth.check.useQuery();

  return (
    <ConnectionsAuthContext.Provider
      value={{
        isAuthenticated: data?.authenticated ?? false,
        isLoading,
        refetch,
      }}
    >
      {children}
    </ConnectionsAuthContext.Provider>
  );
}

export function useConnectionsAuth() {
  const context = useContext(ConnectionsAuthContext);
  if (!context) {
    throw new Error("useConnectionsAuth must be used within a ConnectionsAuthProvider");
  }
  return context;
}
