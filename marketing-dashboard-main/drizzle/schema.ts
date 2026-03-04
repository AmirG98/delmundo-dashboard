import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Organizations (Clients) - Each client organization that uses the dashboard
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  googleSheetId: varchar("googleSheetId", { length: 256 }),
  logo: text("logo"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#f97316"), // Default orange
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Funnels - Platform-specific tabs/funnels for each organization
 */
export const funnels = mysqlTable("funnels", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  platform: mysqlEnum("platform", ["google_ads", "meta_ads", "linkedin_ads", "bing_ads", "hubspot"]).notNull(),
  sheetTabName: varchar("sheetTabName", { length: 256 }).notNull(),
  order: int("order").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = typeof funnels.$inferInsert;

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  hashedPassword: text("hashedPassword"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["client_user", "admin"]).default("client_user").notNull(),
  organizationId: int("organizationId"), // Nullable for admin users
  resetToken: varchar("resetToken", { length: 256 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organization Users - Many-to-many relationship between users and organizations
 * Allows users to access multiple organizations with different roles
 */
export const organizationUsers = mysqlTable("organization_users", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  role: mysqlEnum("role", ["owner", "viewer"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrganizationUser = typeof organizationUsers.$inferSelect;
export type InsertOrganizationUser = typeof organizationUsers.$inferInsert;

/**
 * Platform connections - stores OAuth credentials for each advertising platform
 */
export const platformConnections = mysqlTable("platform_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["google_ads", "meta_ads", "linkedin_ads", "hubspot"]).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  accountId: varchar("accountId", { length: 128 }),
  accountName: varchar("accountName", { length: 256 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = typeof platformConnections.$inferInsert;

/**
 * Campaign metrics - stores aggregated metrics from all platforms
 */
export const campaignMetrics = mysqlTable("campaign_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  platform: mysqlEnum("platform", ["google_ads", "meta_ads", "linkedin_ads", "hubspot"]).notNull(),
  campaignId: varchar("campaignId", { length: 128 }),
  campaignName: varchar("campaignName", { length: 512 }),
  date: timestamp("date").notNull(),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0.00"),
  conversions: int("conversions").default(0),
  reach: int("reach").default(0),
  actions: int("actions").default(0),
  ctr: decimal("ctr", { precision: 8, scale: 4 }).default("0.0000"),
  cpc: decimal("cpc", { precision: 10, scale: 4 }).default("0.0000"),
  cpm: decimal("cpm", { precision: 10, scale: 4 }).default("0.0000"),
  roas: decimal("roas", { precision: 10, scale: 4 }).default("0.0000"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignMetric = typeof campaignMetrics.$inferSelect;
export type InsertCampaignMetric = typeof campaignMetrics.$inferInsert;

/**
 * HubSpot CRM data - contacts and deals
 */
export const hubspotData = mysqlTable("hubspot_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  dataType: mysqlEnum("dataType", ["contact", "deal", "campaign"]).notNull(),
  recordId: varchar("recordId", { length: 128 }),
  recordName: varchar("recordName", { length: 512 }),
  stage: varchar("stage", { length: 128 }),
  value: decimal("value", { precision: 12, scale: 2 }),
  properties: json("properties"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HubspotData = typeof hubspotData.$inferSelect;
export type InsertHubspotData = typeof hubspotData.$inferInsert;

/**
 * Alert configurations - user-defined thresholds for notifications
 */
export const alertConfigs = mysqlTable("alert_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["google_ads", "meta_ads", "linkedin_ads", "hubspot", "all"]).notNull(),
  metricType: mysqlEnum("metricType", ["spend", "ctr", "cpc", "conversions", "impressions", "roas"]).notNull(),
  condition: mysqlEnum("condition", ["above", "below"]).notNull(),
  threshold: decimal("threshold", { precision: 12, scale: 4 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertConfig = typeof alertConfigs.$inferSelect;
export type InsertAlertConfig = typeof alertConfigs.$inferInsert;

/**
 * Alert history - log of triggered alerts
 */
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertConfigId: int("alertConfigId").notNull(),
  platform: mysqlEnum("platform", ["google_ads", "meta_ads", "linkedin_ads", "hubspot", "all"]).notNull(),
  metricType: varchar("metricType", { length: 64 }).notNull(),
  currentValue: decimal("currentValue", { precision: 12, scale: 4 }).notNull(),
  threshold: decimal("threshold", { precision: 12, scale: 4 }).notNull(),
  message: text("message"),
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryEntry = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryEntry = typeof alertHistory.$inferInsert;

/**
 * Generated reports - stored PDF/CSV reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  format: mysqlEnum("format", ["pdf", "csv"]).notNull(),
  dateRangeStart: timestamp("dateRangeStart").notNull(),
  dateRangeEnd: timestamp("dateRangeEnd").notNull(),
  platforms: json("platforms"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  insights: text("insights"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * AI Insights - LLM-generated analysis and recommendations
 */
export const aiInsights = mysqlTable("ai_insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dateRangeStart: timestamp("dateRangeStart").notNull(),
  dateRangeEnd: timestamp("dateRangeEnd").notNull(),
  platforms: json("platforms"),
  summary: text("summary"),
  recommendations: json("recommendations"),
  trends: json("trends"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = typeof aiInsights.$inferInsert;
