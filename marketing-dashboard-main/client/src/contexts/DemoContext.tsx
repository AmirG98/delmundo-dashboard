import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (value: boolean) => void;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check localStorage for saved preference, default to true for new users
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("demoMode");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem("demoMode", String(isDemoMode));
  }, [isDemoMode]);

  const setDemoMode = (value: boolean) => {
    setIsDemoMode(value);
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, setDemoMode, toggleDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoProvider");
  }
  return context;
}
