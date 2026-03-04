import { COOKIE_NAME, PASSWORD_COOKIE_NAME, DASHBOARD_PASSWORD, CONNECTIONS_PASSWORD, CONNECTIONS_COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getPlatformConnectionsByUser,
  createPlatformConnection,
  updatePlatformConnection,
  deletePlatformConnection,
  getConnectionByPlatformAndUser,
  getCampaignMetrics,
  insertCampaignMetrics,
  deleteMetricsByConnection,
  getAlertConfigs,
  createAlertConfig,
  updateAlertConfig,
  deleteAlertConfig,
  getAlertHistory,
  createAlertHistoryEntry,
  getReports,
  createReport,
  getReport,
  updateReport,
  createAiInsight,
  getLatestAiInsight,
  getAiInsights,
  getHubspotData,
  insertHubspotData,
  deleteHubspotDataByConnection,
  // Organization management
  createOrganization,
  getOrganization,
  getAllOrganizations,
  getActiveOrganizations,
  updateOrganization,
  deleteOrganization,
  // Funnel management
  createFunnel,
  getFunnel,
  getFunnelsByOrganization,
  updateFunnel,
  deleteFunnel,
  // User management
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  addUserToOrganization,
  getUserOrganizations,
  getOrganizationUsers,
  removeUserFromOrganization,
} from "./db";
import { generateOAuthUrl, verifyOAuthState, exchangeCodeForTokens } from "./services/oauth";
import { Platform, PLATFORM_CONFIGS, NormalizedMetrics } from "../shared/types";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import {
  generateDemoConnections,
  generateDemoMetrics,
  aggregateDemoMetrics,
  generateDemoInsights,
  generateDemoAlerts,
  generateDemoReports,
  generateDemoTimeSeries,
} from "./services/demoData";
import {
  fetchAllSheetData,
  getAggregatedMetrics,
  getTimeSeriesData,
  fetchCalendarData,
} from "./services/googleSheets";
import { subDays } from "date-fns";

// Platform credential schemas
const platformSchema = z.enum(["google_ads", "meta_ads", "linkedin_ads", "hubspot"]);
const metricTypeSchema = z.enum(["spend", "ctr", "cpc", "conversions", "impressions", "roas"]);
const conditionSchema = z.enum(["above", "below"]);

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string(),
        role: z.enum(['admin', 'client_user']).optional(),
        organizationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { registerUser } = await import('./services/auth');
        const { userId, token } = await registerUser(input);

        // Set JWT cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('auth_token', token, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });

        return { success: true, userId };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { loginUser } = await import('./services/auth');
        const result = await loginUser(input);

        if (!result) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        // Set JWT cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('auth_token', result.token, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });

        return { success: true, user: result.user };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(PASSWORD_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie('auth_token', { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { generateResetToken } = await import('./services/auth');
        const token = await generateResetToken(input.email);

        if (token) {
          // TODO: Send email with reset link
          console.log(`Password reset token: ${token}`);
        }

        // Always return success to prevent email enumeration
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const { resetPassword } = await import('./services/auth');
        const success = await resetPassword(input.token, input.newPassword);

        if (!success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
        }

        return { success: true };
      }),
  }),

  // Simple Password Authentication
  passwordAuth: router({
    check: publicProcedure.query(({ ctx }) => {
      const cookies = ctx.req.headers.cookie || "";
      const hasAccess = cookies.includes(`${PASSWORD_COOKIE_NAME}=authenticated`);
      return { authenticated: hasAccess };
    }),
    
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ ctx, input }) => {
        if (input.password === DASHBOARD_PASSWORD) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(PASSWORD_COOKIE_NAME, "authenticated", {
            ...cookieOptions,
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
          });
          return { success: true };
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(PASSWORD_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // Connections Password Authentication
  connectionsAuth: router({
    check: publicProcedure.query(({ ctx }) => {
      const cookies = ctx.req.headers.cookie || "";
      const hasAccess = cookies.includes(`${CONNECTIONS_COOKIE_NAME}=authenticated`);
      return { authenticated: hasAccess };
    }),

    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ ctx, input }) => {
        if (input.password === CONNECTIONS_PASSWORD) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(CONNECTIONS_COOKIE_NAME, "authenticated", {
            ...cookieOptions,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          });
          return { success: true };
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña de administrador incorrecta" });
      }),
  }),

  // ============ ADMIN ROUTES ============

  // Organizations Management (Admin only)
  organizations: router({
    list: adminProcedure.query(async () => {
      return getAllOrganizations();
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrganization(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        googleSheetId: z.string().optional(),
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createOrganization(input);
        return { id, success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        googleSheetId: z.string().optional(),
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOrganization(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOrganization(input.id);
        return { success: true };
      }),

    listActive: publicProcedure.query(async () => {
      return getActiveOrganizations();
    }),
  }),

  // Funnels Management
  funnels: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        return getFunnelsByOrganization(input.organizationId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getFunnel(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        organizationId: z.number(),
        name: z.string(),
        platform: z.enum(["google_ads", "meta_ads", "linkedin_ads", "bing_ads", "hubspot"]),
        sheetTabName: z.string(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createFunnel(input);
        return { id, success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        platform: z.enum(["google_ads", "meta_ads", "linkedin_ads", "bing_ads", "hubspot"]).optional(),
        sheetTabName: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateFunnel(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFunnel(input.id);
        return { success: true };
      }),
  }),

  // Users Management
  users: router({
    list: adminProcedure.query(async () => {
      const users = await getAllUsers();
      // Remove sensitive fields
      return users.map(u => {
        const { hashedPassword, resetToken, resetTokenExpiry, ...safeUser } = u;
        return safeUser;
      });
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.id);
        if (!user) return null;
        const { hashedPassword, resetToken, resetTokenExpiry, ...safeUser } = user;
        return safeUser;
      }),

    create: adminProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string(),
        role: z.enum(['admin', 'client_user']).optional(),
        organizationId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { registerUser } = await import('./services/auth');
        const { userId } = await registerUser(input);
        return { id: userId, success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(['admin', 'client_user']).optional(),
        organizationId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateUser(id, data);
        return { success: true };
      }),

    addToOrganization: adminProcedure
      .input(z.object({
        userId: z.number(),
        organizationId: z.number(),
        role: z.enum(['owner', 'viewer']).optional(),
      }))
      .mutation(async ({ input }) => {
        await addUserToOrganization(input);
        return { success: true };
      }),

    removeFromOrganization: adminProcedure
      .input(z.object({
        userId: z.number(),
        organizationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await removeUserFromOrganization(input.userId, input.organizationId);
        return { success: true };
      }),

    getOrganizations: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getUserOrganizations(input.userId);
      }),

    getOrganizationUsers: adminProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        return getOrganizationUsers(input.organizationId);
      }),
  }),

  // Platform Connections
  connections: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getPlatformConnectionsByUser(ctx.user.id);
    }),

    getOAuthUrl: protectedProcedure
      .input(z.object({
        platform: platformSchema,
        clientId: z.string(),
        redirectUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const url = generateOAuthUrl(
          input.platform,
          ctx.user.id,
          input.clientId,
          input.redirectUrl
        );
        return { url };
      }),

    handleCallback: protectedProcedure
      .input(z.object({
        platform: platformSchema,
        code: z.string(),
        state: z.string(),
        clientId: z.string(),
        clientSecret: z.string(),
        accountId: z.string().optional(),
        accountName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const stateData = verifyOAuthState(input.state);
        if (!stateData || stateData.userId !== ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid OAuth state" });
        }

        const tokens = await exchangeCodeForTokens(
          input.platform,
          input.code,
          input.clientId,
          input.clientSecret
        );

        // Check if connection already exists
        const existing = await getConnectionByPlatformAndUser(ctx.user.id, input.platform);
        
        if (existing) {
          await updatePlatformConnection(existing.id, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.expiresIn 
              ? new Date(Date.now() + tokens.expiresIn * 1000) 
              : null,
            accountId: input.accountId || existing.accountId,
            accountName: input.accountName || existing.accountName,
            isActive: true,
          });
          return { connectionId: existing.id, updated: true };
        }

        const connectionId = await createPlatformConnection({
          userId: ctx.user.id,
          platform: input.platform,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresIn 
            ? new Date(Date.now() + tokens.expiresIn * 1000) 
            : null,
          accountId: input.accountId,
          accountName: input.accountName,
          isActive: true,
        });

        return { connectionId, updated: false };
      }),

    disconnect: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Delete associated metrics first
        await deleteMetricsByConnection(input.connectionId);
        await deleteHubspotDataByConnection(input.connectionId);
        await deletePlatformConnection(input.connectionId);
        return { success: true };
      }),

    updateCredentials: protectedProcedure
      .input(z.object({
        connectionId: z.number(),
        accountId: z.string().optional(),
        accountName: z.string().optional(),
        developerToken: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updatePlatformConnection(input.connectionId, {
          accountId: input.accountId,
          accountName: input.accountName,
        });
        return { success: true };
      }),
  }),

  // Metrics
  metrics: router({
    get: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        platform: platformSchema.optional(),
      }))
      .query(async ({ ctx, input }) => {
        const metrics = await getCampaignMetrics(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate),
          input.platform
        );
        return metrics;
      }),

    getAggregated: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const metrics = await getCampaignMetrics(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        // Aggregate by platform
        const byPlatform: Record<string, NormalizedMetrics> = {};
        const totals = {
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          reach: 0,
        };

        for (const m of metrics) {
          if (!byPlatform[m.platform]) {
            byPlatform[m.platform] = {
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
              reach: 0,
              ctr: 0,
              cpc: 0,
              cpm: 0,
              roas: 0,
            };
          }
          
          byPlatform[m.platform].impressions += m.impressions || 0;
          byPlatform[m.platform].clicks += m.clicks || 0;
          byPlatform[m.platform].spend += parseFloat(String(m.spend)) || 0;
          byPlatform[m.platform].conversions += m.conversions || 0;
          byPlatform[m.platform].reach += m.reach || 0;

          totals.impressions += m.impressions || 0;
          totals.clicks += m.clicks || 0;
          totals.spend += parseFloat(String(m.spend)) || 0;
          totals.conversions += m.conversions || 0;
          totals.reach += m.reach || 0;
        }

        // Calculate derived metrics
        for (const platform of Object.keys(byPlatform)) {
          const p = byPlatform[platform];
          p.ctr = p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0;
          p.cpc = p.clicks > 0 ? p.spend / p.clicks : 0;
          p.cpm = p.impressions > 0 ? (p.spend / p.impressions) * 1000 : 0;
          p.roas = p.spend > 0 ? p.conversions / p.spend : 0;
        }

        const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
        const totalCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
        const totalCpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
        const totalRoas = totals.spend > 0 ? totals.conversions / totals.spend : 0;

        return {
          totals: {
            ...totals,
            ctr: totalCtr,
            cpc: totalCpc,
            cpm: totalCpm,
            roas: totalRoas,
          },
          byPlatform,
        };
      }),

    getTimeSeries: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        platform: platformSchema.optional(),
      }))
      .query(async ({ ctx, input }) => {
        const metrics = await getCampaignMetrics(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate),
          input.platform
        );

        // Group by date
        const byDate: Record<string, {
          impressions: number;
          clicks: number;
          spend: number;
          conversions: number;
        }> = {};

        for (const m of metrics) {
          const dateStr = m.date.toISOString().split('T')[0];
          if (!byDate[dateStr]) {
            byDate[dateStr] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
          }
          byDate[dateStr].impressions += m.impressions || 0;
          byDate[dateStr].clicks += m.clicks || 0;
          byDate[dateStr].spend += parseFloat(String(m.spend)) || 0;
          byDate[dateStr].conversions += m.conversions || 0;
        }

        return Object.entries(byDate)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }),

    refresh: protectedProcedure
      .input(z.object({ platform: platformSchema.optional() }))
      .mutation(async ({ ctx, input }) => {
        // This would trigger a sync with the platform APIs
        // For now, return success - actual implementation would call platform APIs
        return { success: true, message: "Metrics refresh initiated" };
      }),
  }),

  // HubSpot specific data
  hubspot: router({
    getData: protectedProcedure
      .input(z.object({
        dataType: z.enum(["contact", "deal", "campaign"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getHubspotData(ctx.user.id, input.dataType);
      }),
  }),

  // Alerts
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAlertConfigs(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        platform: z.enum(["google_ads", "meta_ads", "linkedin_ads", "hubspot", "all"]),
        metricType: metricTypeSchema,
        condition: conditionSchema,
        threshold: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createAlertConfig({
          userId: ctx.user.id,
          platform: input.platform,
          metricType: input.metricType,
          condition: input.condition,
          threshold: String(input.threshold),
          isActive: true,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        threshold: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateAlertConfig(input.id, {
          isActive: input.isActive,
          threshold: input.threshold !== undefined ? String(input.threshold) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAlertConfig(input.id);
        return { success: true };
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getAlertHistory(ctx.user.id, input.limit || 50);
      }),

    checkAndNotify: protectedProcedure.mutation(async ({ ctx }) => {
      const alerts = await getAlertConfigs(ctx.user.id);
      const activeAlerts = alerts.filter(a => a.isActive);
      
      if (activeAlerts.length === 0) {
        return { triggered: 0 };
      }

      // Get recent metrics
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const metrics = await getCampaignMetrics(ctx.user.id, startDate, endDate);
      
      // Calculate totals
      const totals = metrics.reduce((acc, m) => ({
        spend: acc.spend + (parseFloat(String(m.spend)) || 0),
        impressions: acc.impressions + (m.impressions || 0),
        clicks: acc.clicks + (m.clicks || 0),
        conversions: acc.conversions + (m.conversions || 0),
      }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      const roas = totals.spend > 0 ? totals.conversions / totals.spend : 0;

      const metricValues: Record<string, number> = {
        spend: totals.spend,
        impressions: totals.impressions,
        conversions: totals.conversions,
        ctr,
        cpc,
        roas,
      };

      let triggered = 0;

      for (const alert of activeAlerts) {
        const currentValue = metricValues[alert.metricType] || 0;
        const threshold = parseFloat(String(alert.threshold));
        
        const isTriggered = alert.condition === "above" 
          ? currentValue > threshold 
          : currentValue < threshold;

        if (isTriggered) {
          triggered++;
          
          const message = `Alert: ${alert.metricType} is ${alert.condition} threshold. Current: ${currentValue.toFixed(2)}, Threshold: ${threshold}`;
          
          await createAlertHistoryEntry({
            userId: ctx.user.id,
            alertConfigId: alert.id,
            platform: alert.platform,
            metricType: alert.metricType,
            currentValue: String(currentValue),
            threshold: String(threshold),
            message,
            notificationSent: true,
          });

          // Notify owner
          await notifyOwner({
            title: `Marketing Alert: ${alert.metricType.toUpperCase()}`,
            content: message,
          });

          // Update last triggered
          await updateAlertConfig(alert.id, {
            lastTriggeredAt: new Date(),
          });
        }
      }

      return { triggered };
    }),
  }),

  // Reports
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getReports(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getReport(input.id);
      }),

    generate: protectedProcedure
      .input(z.object({
        title: z.string(),
        format: z.enum(["pdf", "csv"]),
        startDate: z.string(),
        endDate: z.string(),
        platforms: z.array(platformSchema),
        includeInsights: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get metrics for the date range
        const metrics = await getCampaignMetrics(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        // Filter by platforms if specified
        const filteredMetrics = input.platforms.length > 0
          ? metrics.filter(m => input.platforms.includes(m.platform as Platform))
          : metrics;

        // Generate insights if requested
        let insights = "";
        if (input.includeInsights) {
          const insightData = await getLatestAiInsight(ctx.user.id);
          insights = insightData?.summary || "";
        }

        // Generate report content
        let content: string;
        let contentType: string;
        let fileExtension: string;

        if (input.format === "csv") {
          // Generate CSV
          const headers = ["Date", "Platform", "Campaign", "Impressions", "Clicks", "Spend", "Conversions", "CTR", "CPC"];
          const rows = filteredMetrics.map(m => [
            m.date.toISOString().split('T')[0],
            m.platform,
            m.campaignName || "",
            m.impressions,
            m.clicks,
            m.spend,
            m.conversions,
            m.ctr,
            m.cpc,
          ].join(","));
          
          content = [headers.join(","), ...rows].join("\n");
          contentType = "text/csv";
          fileExtension = "csv";
        } else {
          // Generate simple HTML for PDF (would use proper PDF library in production)
          content = `
            <html>
              <head><title>${input.title}</title></head>
              <body>
                <h1>${input.title}</h1>
                <p>Date Range: ${input.startDate} to ${input.endDate}</p>
                <h2>Summary</h2>
                <table border="1">
                  <tr><th>Metric</th><th>Value</th></tr>
                  <tr><td>Total Impressions</td><td>${filteredMetrics.reduce((s, m) => s + (m.impressions || 0), 0)}</td></tr>
                  <tr><td>Total Clicks</td><td>${filteredMetrics.reduce((s, m) => s + (m.clicks || 0), 0)}</td></tr>
                  <tr><td>Total Spend</td><td>$${filteredMetrics.reduce((s, m) => s + parseFloat(String(m.spend) || "0"), 0).toFixed(2)}</td></tr>
                  <tr><td>Total Conversions</td><td>${filteredMetrics.reduce((s, m) => s + (m.conversions || 0), 0)}</td></tr>
                </table>
                ${insights ? `<h2>AI Insights</h2><p>${insights}</p>` : ""}
              </body>
            </html>
          `;
          contentType = "text/html";
          fileExtension = "html";
        }

        // Upload to S3
        const fileKey = `reports/${ctx.user.id}/${nanoid()}.${fileExtension}`;
        const { url } = await storagePut(fileKey, content, contentType);

        // Save report record
        const reportId = await createReport({
          userId: ctx.user.id,
          title: input.title,
          format: input.format,
          dateRangeStart: new Date(input.startDate),
          dateRangeEnd: new Date(input.endDate),
          platforms: input.platforms,
          fileUrl: url,
          fileKey,
          insights,
        });

        return { id: reportId, url };
      }),
  }),

  // AI Insights
  insights: router({
    latest: protectedProcedure.query(async ({ ctx }) => {
      return getLatestAiInsight(ctx.user.id);
    }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getAiInsights(ctx.user.id, input.limit || 10);
      }),

    generate: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        platforms: z.array(platformSchema).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get metrics
        const metrics = await getCampaignMetrics(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        if (metrics.length === 0) {
          return { 
            summary: "No data available for the selected period.",
            recommendations: [],
            trends: [],
          };
        }

        // Aggregate metrics for LLM
        const totals = metrics.reduce((acc, m) => ({
          impressions: acc.impressions + (m.impressions || 0),
          clicks: acc.clicks + (m.clicks || 0),
          spend: acc.spend + parseFloat(String(m.spend) || "0"),
          conversions: acc.conversions + (m.conversions || 0),
        }), { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

        const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
        const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
        const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

        // Group by platform
        const byPlatform: Record<string, typeof totals> = {};
        for (const m of metrics) {
          if (!byPlatform[m.platform]) {
            byPlatform[m.platform] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
          }
          byPlatform[m.platform].impressions += m.impressions || 0;
          byPlatform[m.platform].clicks += m.clicks || 0;
          byPlatform[m.platform].spend += parseFloat(String(m.spend) || "0");
          byPlatform[m.platform].conversions += m.conversions || 0;
        }

        const prompt = `Analyze the following marketing campaign performance data and provide actionable insights:

Period: ${input.startDate} to ${input.endDate}

Overall Metrics:
- Total Impressions: ${totals.impressions.toLocaleString()}
- Total Clicks: ${totals.clicks.toLocaleString()}
- Total Spend: $${totals.spend.toFixed(2)}
- Total Conversions: ${totals.conversions}
- CTR: ${ctr.toFixed(2)}%
- CPC: $${cpc.toFixed(2)}
- Conversion Rate: ${conversionRate.toFixed(2)}%

By Platform:
${Object.entries(byPlatform).map(([platform, data]) => `
${platform}:
  - Impressions: ${data.impressions.toLocaleString()}
  - Clicks: ${data.clicks.toLocaleString()}
  - Spend: $${data.spend.toFixed(2)}
  - Conversions: ${data.conversions}
`).join("")}

Please provide:
1. A brief summary of overall performance (2-3 sentences)
2. Key trends observed
3. 3-5 specific, actionable recommendations to improve performance
4. Any concerns or areas needing immediate attention

Format your response as JSON with the following structure:
{
  "summary": "string",
  "trends": [{"metric": "string", "direction": "up|down|stable", "percentChange": number, "description": "string"}],
  "recommendations": [{"priority": "high|medium|low", "platform": "string", "title": "string", "description": "string", "expectedImpact": "string"}]
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a marketing analytics expert. Analyze campaign data and provide actionable insights. Always respond with valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "marketing_insights",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    trends: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          metric: { type: "string" },
                          direction: { type: "string", enum: ["up", "down", "stable"] },
                          percentChange: { type: "number" },
                          description: { type: "string" },
                        },
                        required: ["metric", "direction", "percentChange", "description"],
                        additionalProperties: false,
                      },
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                          platform: { type: "string" },
                          title: { type: "string" },
                          description: { type: "string" },
                          expectedImpact: { type: "string" },
                        },
                        required: ["priority", "platform", "title", "description", "expectedImpact"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["summary", "trends", "recommendations"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : '{}';
          const insights = JSON.parse(content);

          // Save to database
          await createAiInsight({
            userId: ctx.user.id,
            dateRangeStart: new Date(input.startDate),
            dateRangeEnd: new Date(input.endDate),
            platforms: input.platforms || Object.keys(byPlatform),
            summary: insights.summary,
            recommendations: insights.recommendations,
            trends: insights.trends,
          });

          return insights;
        } catch (error: any) {
          console.error("LLM error:", error);
          return {
            summary: "Unable to generate insights at this time.",
            recommendations: [],
            trends: [],
          };
        }
      }),
  }),

  // Platform configs (public info)
  platformConfigs: router({
    list: publicProcedure.query(() => {
      return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
        id: key,
        ...config,
      }));
    }),
  }),

  // Demo mode endpoints
  demo: router({
    connections: publicProcedure.query(() => {
      return generateDemoConnections();
    }),

    metrics: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        platforms: z.array(platformSchema).optional(),
      }))
      .query(({ input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        const metrics = generateDemoMetrics(startDate, endDate);
        
        // Filter by platforms if specified
        const filteredMetrics = input.platforms
          ? metrics.filter(m => input.platforms!.includes(m.platform))
          : metrics;
        
        return filteredMetrics;
      }),

    aggregated: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        platforms: z.array(platformSchema).optional(),
      }))
      .query(({ input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        const metrics = generateDemoMetrics(startDate, endDate);
        
        const filteredMetrics = input.platforms
          ? metrics.filter(m => input.platforms!.includes(m.platform))
          : metrics;
        
        return aggregateDemoMetrics(filteredMetrics);
      }),

    timeSeries: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        platforms: z.array(platformSchema).optional(),
      }))
      .query(({ input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        const metrics = generateDemoMetrics(startDate, endDate);
        
        const filteredMetrics = input.platforms
          ? metrics.filter(m => input.platforms!.includes(m.platform))
          : metrics;
        
        // Group metrics by date
        const byDate: Record<string, { impressions: number; clicks: number; spend: number; conversions: number }> = {};
        for (const m of filteredMetrics) {
          if (!byDate[m.date]) {
            byDate[m.date] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
          }
          byDate[m.date].impressions += m.impressions;
          byDate[m.date].clicks += m.clicks;
          byDate[m.date].spend += m.spend;
          byDate[m.date].conversions += m.conversions;
        }
        
        // Convert to array sorted by date
        return Object.entries(byDate)
          .map(([date, data]) => ({
            date,
            ...data,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }),

    insights: publicProcedure.query(() => {
      return generateDemoInsights();
    }),

    alerts: publicProcedure.query(() => {
      return generateDemoAlerts();
    }),

    reports: publicProcedure.query(() => {
      return generateDemoReports();
    }),
  }),

  // Google Sheets Integration
  sheets: router({
    // LEGACY: Fetch all data from Google Sheets (for backward compatibility)
    fetchAll: publicProcedure.query(async () => {
      try {
        const data = await fetchAllSheetData();
        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('Error fetching sheet data:', error);
        return {
          success: false,
          error: 'Failed to fetch data from Google Sheets',
          data: null,
        };
      }
    }),

    // NEW: Fetch data for user's organization
    fetchForOrganization: protectedProcedure
      .input(z.object({
        selectedOrgId: z.number().optional(), // For admin users
      }))
      .query(async ({ ctx, input }) => {
        try {
          // Determine organizationId
          let organizationId: number | null = null;

          if (ctx.user.role === 'admin' && input.selectedOrgId) {
            organizationId = input.selectedOrgId;
          } else if (ctx.user.organizationId) {
            organizationId = ctx.user.organizationId;
          }

          if (!organizationId) {
            return {
              success: false,
              error: 'No organization selected',
              data: null,
            };
          }

          const { fetchSheetDataForOrganization } = await import('./services/googleSheets');
          const data = await fetchSheetDataForOrganization(organizationId);

          return {
            success: true,
            data,
          };
        } catch (error) {
          console.error('Error fetching sheet data for organization:', error);
          return {
            success: false,
            error: 'Failed to fetch data from Google Sheets',
            data: null,
          };
        }
      }),

    // Get aggregated metrics with optional filters (MULTI-TENANT)
    aggregated: protectedProcedure
      .input(z.object({
        funnelName: z.string().optional(),
        platform: z.string().optional(),
        selectedOrgId: z.number().optional(), // For admin users
      }))
      .query(async ({ ctx, input }) => {
        try {
          // Determine organizationId
          let organizationId: number | null = null;

          if (ctx.user.role === 'admin' && input.selectedOrgId) {
            organizationId = input.selectedOrgId;
          } else if (ctx.user.organizationId) {
            organizationId = ctx.user.organizationId;
          }

          if (!organizationId) {
            // Fallback to legacy system for backward compatibility
            const metrics = await getAggregatedMetrics(input.funnelName, input.platform);
            return {
              success: true,
              data: metrics,
            };
          }

          const { getAggregatedMetricsForOrganization } = await import('./services/googleSheets');
          const metrics = await getAggregatedMetricsForOrganization(
            organizationId,
            input.funnelName,
            input.platform
          );

          return {
            success: true,
            data: metrics,
          };
        } catch (error) {
          console.error('Error fetching aggregated metrics:', error);
          return {
            success: false,
            error: 'Failed to fetch aggregated metrics',
            data: null,
          };
        }
      }),

    // Get time series data (LEGACY - keeping for backward compatibility)
    timeSeries: publicProcedure
      .input(z.object({
        businessUnit: z.string().optional(),
        platform: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const data = await getTimeSeriesData(input.businessUnit, input.platform);
          return {
            success: true,
            data,
          };
        } catch (error) {
          console.error('Error fetching time series:', error);
          return {
            success: false,
            error: 'Failed to fetch time series data',
            data: null,
          };
        }
      }),

    // Get campaigns list
    campaigns: protectedProcedure
      .input(z.object({
        funnelName: z.string().optional(),
        platform: z.string().optional(),
        selectedOrgId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        try {
          // Determine organizationId
          let organizationId: number | null = null;

          if (ctx.user.role === 'admin' && input.selectedOrgId) {
            organizationId = input.selectedOrgId;
          } else if (ctx.user.organizationId) {
            organizationId = ctx.user.organizationId;
          }

          if (!organizationId) {
            // Fallback to legacy
            const metrics = await getAggregatedMetrics(input.funnelName, input.platform);
            return {
              success: true,
              data: metrics.campaigns,
              dateRange: metrics.dateRange,
            };
          }

          const { getAggregatedMetricsForOrganization } = await import('./services/googleSheets');
          const metrics = await getAggregatedMetricsForOrganization(
            organizationId,
            input.funnelName,
            input.platform
          );

          return {
            success: true,
            data: metrics?.campaigns || [],
            dateRange: metrics?.dateRange || '',
          };
        } catch (error) {
          console.error('Error fetching campaigns:', error);
          return {
            success: false,
            error: 'Failed to fetch campaigns',
            data: [],
            dateRange: '',
          };
        }
      }),

    // Get calendar/timeline data from Cronograma de Entregables
    calendar: publicProcedure
      .input(z.object({
        businessUnit: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const actions = await fetchCalendarData();
          // Filter by business unit if specified
          const filtered = input.businessUnit && input.businessUnit !== 'all'
            ? actions.filter(a => a.businessUnit === input.businessUnit || a.businessUnit === 'all')
            : actions;
          return {
            success: true,
            data: filtered,
          };
        } catch (error) {
          console.error('Error fetching calendar data:', error);
          return {
            success: false,
            error: 'Failed to fetch calendar data',
            data: [],
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
