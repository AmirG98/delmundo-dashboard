import { createContext, useContext, useState, ReactNode } from "react";

export type BusinessUnit = "lemonsuite" | "casetracking" | "lemonflow";
export type AdPlatform = "all" | "google" | "meta" | "linkedin" | "hubspot";

interface BusinessUnitContextType {
  businessUnit: BusinessUnit;
  setBusinessUnit: (unit: BusinessUnit) => void;
  adPlatform: AdPlatform;
  setAdPlatform: (platform: AdPlatform) => void;
  getDisplayName: (unit: BusinessUnit) => string;
  getPlatformDisplayName: (platform: AdPlatform) => string;
}

const BusinessUnitContext = createContext<BusinessUnitContextType | undefined>(undefined);

export const BUSINESS_UNITS: { id: BusinessUnit; name: string; description: string }[] = [
  { id: "lemonsuite", name: "LemonSuite", description: "Control total de estudios jurídicos" },
  { id: "casetracking", name: "CaseTracking", description: "Seguimiento automatizado de juicios" },
  { id: "lemonflow", name: "LemonFlow", description: "Automatización de flujos de trabajo legal" },
];

export const AD_PLATFORMS: { id: AdPlatform; name: string; icon: string }[] = [
  { id: "all", name: "Todas las plataformas", icon: "📊" },
  { id: "google", name: "Google Ads", icon: "🔍" },
  { id: "meta", name: "Meta Ads", icon: "📘" },
  { id: "linkedin", name: "LinkedIn Ads", icon: "💼" },
  { id: "hubspot", name: "HubSpot", icon: "🟠" },
];

export function BusinessUnitProvider({ children }: { children: ReactNode }) {
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>("lemonsuite");
  const [adPlatform, setAdPlatform] = useState<AdPlatform>("all");

  const getDisplayName = (unit: BusinessUnit): string => {
    return BUSINESS_UNITS.find(u => u.id === unit)?.name || unit;
  };

  const getPlatformDisplayName = (platform: AdPlatform): string => {
    return AD_PLATFORMS.find(p => p.id === platform)?.name || platform;
  };

  return (
    <BusinessUnitContext.Provider
      value={{
        businessUnit,
        setBusinessUnit,
        adPlatform,
        setAdPlatform,
        getDisplayName,
        getPlatformDisplayName,
      }}
    >
      {children}
    </BusinessUnitContext.Provider>
  );
}

export function useBusinessUnit() {
  const context = useContext(BusinessUnitContext);
  if (!context) {
    throw new Error("useBusinessUnit must be used within a BusinessUnitProvider");
  }
  return context;
}
