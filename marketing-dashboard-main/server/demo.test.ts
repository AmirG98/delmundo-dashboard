import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { format, subDays } from "date-fns";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Demo Mode API", () => {
  describe("demo.connections", () => {
    it("returns demo connections for all platforms", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.connections();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(4);
      
      const platforms = result.map(c => c.platform);
      expect(platforms).toContain("google_ads");
      expect(platforms).toContain("meta_ads");
      expect(platforms).toContain("linkedin_ads");
      expect(platforms).toContain("hubspot");
      
      // All should be active
      result.forEach(connection => {
        expect(connection.isActive).toBe(true);
      });
    });
  });

  describe("demo.metrics", () => {
    it("returns demo metrics for date range", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.metrics({
        startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // Each metric should have required fields
      result.forEach(metric => {
        expect(metric).toHaveProperty("platform");
        expect(metric).toHaveProperty("date");
        expect(metric).toHaveProperty("impressions");
        expect(metric).toHaveProperty("clicks");
        expect(metric).toHaveProperty("spend");
        expect(metric).toHaveProperty("conversions");
      });
    });

    it("filters metrics by platform", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.metrics({
        startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
        platforms: ["google_ads"],
      });

      expect(result).toBeInstanceOf(Array);
      result.forEach(metric => {
        expect(metric.platform).toBe("google_ads");
      });
    });
  });

  describe("demo.aggregated", () => {
    it("returns aggregated metrics with totals and byPlatform", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.aggregated({
        startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      });

      expect(result).toHaveProperty("totals");
      expect(result).toHaveProperty("byPlatform");
      expect(result).toHaveProperty("byBusinessUnit");
      
      // Check totals structure
      expect(result.totals).toHaveProperty("impressions");
      expect(result.totals).toHaveProperty("clicks");
      expect(result.totals).toHaveProperty("spend");
      expect(result.totals).toHaveProperty("conversions");
      expect(result.totals).toHaveProperty("ctr");
      expect(result.totals).toHaveProperty("cpc");
      
      // Check byPlatform has all platforms
      expect(result.byPlatform).toHaveProperty("google_ads");
      expect(result.byPlatform).toHaveProperty("meta_ads");
      expect(result.byPlatform).toHaveProperty("linkedin_ads");
      expect(result.byPlatform).toHaveProperty("hubspot");
    });
  });

  describe("demo.timeSeries", () => {
    it("returns time series data sorted by date", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.timeSeries({
        startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // Check sorted by date
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date >= result[i - 1].date).toBe(true);
      }
      
      // Each entry should have aggregated metrics
      result.forEach(entry => {
        expect(entry).toHaveProperty("date");
        expect(entry).toHaveProperty("impressions");
        expect(entry).toHaveProperty("clicks");
        expect(entry).toHaveProperty("spend");
      });
    });
  });

  describe("demo.insights", () => {
    it("returns demo insights with summary, trends, and recommendations", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.insights();

      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("trends");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("generatedAt");
      
      expect(typeof result.summary).toBe("string");
      expect(result.trends).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      
      // Check trends structure
      result.trends.forEach(trend => {
        expect(trend).toHaveProperty("metric");
        expect(trend).toHaveProperty("direction");
        expect(trend).toHaveProperty("percentage");
        expect(trend).toHaveProperty("insight");
      });
      
      // Check recommendations is an array of strings
      result.recommendations.forEach(rec => {
        expect(typeof rec).toBe("string");
      });
    });
  });

  describe("demo.alerts", () => {
    it("returns demo alert configurations", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.alerts();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(alert => {
        expect(alert).toHaveProperty("id");
        expect(alert).toHaveProperty("metricType");
        expect(alert).toHaveProperty("condition");
        expect(alert).toHaveProperty("threshold");
        expect(alert).toHaveProperty("isTriggered");
      });
    });
  });

  describe("demo.reports", () => {
    it("returns demo reports", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.demo.reports();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(report => {
        expect(report).toHaveProperty("id");
        expect(report).toHaveProperty("title");
        expect(report).toHaveProperty("format");
        expect(report).toHaveProperty("dateRange");
        expect(report).toHaveProperty("generatedAt");
      });
    });
  });
});
