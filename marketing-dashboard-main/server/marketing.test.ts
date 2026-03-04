import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getPlatformConnectionsByUser: vi.fn().mockResolvedValue([]),
  createPlatformConnection: vi.fn().mockResolvedValue({ id: 1 }),
  updatePlatformConnection: vi.fn().mockResolvedValue(undefined),
  deletePlatformConnection: vi.fn().mockResolvedValue(undefined),
  getConnectionByPlatformAndUser: vi.fn().mockResolvedValue(null),
  getCampaignMetrics: vi.fn().mockResolvedValue([]),
  insertCampaignMetrics: vi.fn().mockResolvedValue(undefined),
  deleteMetricsByConnection: vi.fn().mockResolvedValue(undefined),
  getAlertConfigs: vi.fn().mockResolvedValue([]),
  createAlertConfig: vi.fn().mockResolvedValue({ id: 1 }),
  updateAlertConfig: vi.fn().mockResolvedValue(undefined),
  deleteAlertConfig: vi.fn().mockResolvedValue(undefined),
  getAlertHistory: vi.fn().mockResolvedValue([]),
  createAlertHistoryEntry: vi.fn().mockResolvedValue(undefined),
  getReports: vi.fn().mockResolvedValue([]),
  createReport: vi.fn().mockResolvedValue({ id: 1 }),
  getReport: vi.fn().mockResolvedValue(null),
  updateReport: vi.fn().mockResolvedValue(undefined),
  createAiInsight: vi.fn().mockResolvedValue({ id: 1 }),
  getLatestAiInsight: vi.fn().mockResolvedValue(null),
  getAiInsights: vi.fn().mockResolvedValue([]),
  getHubspotData: vi.fn().mockResolvedValue([]),
  insertHubspotData: vi.fn().mockResolvedValue(undefined),
  deleteHubspotDataByConnection: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  getDb: vi.fn().mockResolvedValue(null),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Marketing Dashboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auth.me", () => {
    it("returns user when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe("test@example.com");
    });

    it("returns null when not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });
  });

  describe("connections.list", () => {
    it("returns empty array when no connections exist", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connections.list();

      expect(result).toEqual([]);
    });
  });

  describe("connections.getOAuthUrl", () => {
    it("generates OAuth URL for Google Ads", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connections.getOAuthUrl({
        platform: "google_ads",
        clientId: "test-client-id",
      });

      expect(result.url).toBeDefined();
      expect(result.url).toContain("accounts.google.com");
    });

    it("generates OAuth URL for Meta Ads", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connections.getOAuthUrl({
        platform: "meta_ads",
        clientId: "test-client-id",
      });

      expect(result.url).toBeDefined();
      expect(result.url).toContain("facebook.com");
    });

    it("generates OAuth URL for LinkedIn Ads", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connections.getOAuthUrl({
        platform: "linkedin_ads",
        clientId: "test-client-id",
      });

      expect(result.url).toBeDefined();
      expect(result.url).toContain("linkedin.com");
    });

    it("generates OAuth URL for HubSpot", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.connections.getOAuthUrl({
        platform: "hubspot",
        clientId: "test-client-id",
      });

      expect(result.url).toBeDefined();
      expect(result.url).toContain("hubspot.com");
    });
  });

  describe("alerts.list", () => {
    it("returns empty array when no alerts configured", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.alerts.list();

      expect(result).toEqual([]);
    });
  });

  describe("alerts.create", () => {
    it("creates a new alert configuration", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.alerts.create({
        platform: "all",
        metricType: "spend",
        condition: "above",
        threshold: 1000,
      });

      expect(result).toBeDefined();
    });

    it("creates alert with specific platform", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.alerts.create({
        platform: "google_ads",
        metricType: "ctr",
        condition: "below",
        threshold: 2.5,
      });

      expect(result).toBeDefined();
    });
  });

  describe("reports.list", () => {
    it("returns empty array when no reports exist", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.list();

      expect(result).toEqual([]);
    });
  });

  describe("reports.generate", () => {
    it("creates a new report", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.generate({
        title: "Test Report",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        format: "pdf",
        platforms: ["google_ads", "meta_ads"],
      });

      expect(result).toBeDefined();
    });
  });

  describe("insights.latest", () => {
    it("returns null when no insights exist", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.insights.latest();

      expect(result).toBeNull();
    });
  });

  describe("metrics.getAggregated", () => {
    it("returns aggregated metrics for date range", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metrics.getAggregated({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.totals).toBeDefined();
      expect(result.byPlatform).toBeDefined();
    });
  });

  describe("metrics.getTimeSeries", () => {
    it("returns time series data", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metrics.getTimeSeries({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("platformConfigs.list", () => {
    it("returns all platform configurations", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.platformConfigs.list();

      expect(result).toBeDefined();
      expect(result.length).toBe(4);
      expect(result.map(p => p.id)).toContain("google_ads");
      expect(result.map(p => p.id)).toContain("meta_ads");
      expect(result.map(p => p.id)).toContain("linkedin_ads");
      expect(result.map(p => p.id)).toContain("hubspot");
    });
  });
});
