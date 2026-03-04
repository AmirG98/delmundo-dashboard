import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, User,
  organizations, InsertOrganization, Organization,
  funnels, InsertFunnel, Funnel,
  organizationUsers, InsertOrganizationUser, OrganizationUser,
  platformConnections, InsertPlatformConnection, PlatformConnection,
  campaignMetrics, InsertCampaignMetric, CampaignMetric,
  hubspotData, InsertHubspotData,
  alertConfigs, InsertAlertConfig,
  alertHistory, InsertAlertHistoryEntry,
  reports, InsertReport,
  aiInsights, InsertAiInsight
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PLATFORM CONNECTIONS ============

export async function createPlatformConnection(data: InsertPlatformConnection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(platformConnections).values(data);
  return result[0].insertId;
}

export async function updatePlatformConnection(id: number, data: Partial<InsertPlatformConnection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(platformConnections).set(data).where(eq(platformConnections.id, id));
}

export async function getPlatformConnectionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(platformConnections).where(eq(platformConnections.userId, userId));
}

export async function getPlatformConnection(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(platformConnections).where(eq(platformConnections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deletePlatformConnection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(platformConnections).where(eq(platformConnections.id, id));
}

export async function getConnectionByPlatformAndUser(userId: number, platform: PlatformConnection["platform"]) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(platformConnections)
    .where(and(eq(platformConnections.userId, userId), eq(platformConnections.platform, platform)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CAMPAIGN METRICS ============

export async function insertCampaignMetrics(data: InsertCampaignMetric[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (data.length === 0) return;
  await db.insert(campaignMetrics).values(data);
}

export async function getCampaignMetrics(
  userId: number, 
  startDate: Date, 
  endDate: Date,
  platform?: CampaignMetric["platform"]
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(campaignMetrics.userId, userId),
    gte(campaignMetrics.date, startDate),
    lte(campaignMetrics.date, endDate)
  ];
  
  if (platform) {
    conditions.push(eq(campaignMetrics.platform, platform));
  }
  
  return db.select().from(campaignMetrics)
    .where(and(...conditions))
    .orderBy(desc(campaignMetrics.date));
}

export async function getAggregatedMetrics(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(campaignMetrics)
    .where(and(
      eq(campaignMetrics.userId, userId),
      gte(campaignMetrics.date, startDate),
      lte(campaignMetrics.date, endDate)
    ))
    .orderBy(desc(campaignMetrics.date));
}

export async function deleteMetricsByConnection(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(campaignMetrics).where(eq(campaignMetrics.connectionId, connectionId));
}

// ============ HUBSPOT DATA ============

export async function insertHubspotData(data: InsertHubspotData[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (data.length === 0) return;
  await db.insert(hubspotData).values(data);
}

export async function getHubspotData(userId: number, dataType?: "contact" | "deal" | "campaign") {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(hubspotData.userId, userId)];
  if (dataType) {
    conditions.push(eq(hubspotData.dataType, dataType));
  }
  
  return db.select().from(hubspotData)
    .where(and(...conditions))
    .orderBy(desc(hubspotData.date));
}

export async function deleteHubspotDataByConnection(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(hubspotData).where(eq(hubspotData.connectionId, connectionId));
}

// ============ ALERT CONFIGS ============

export async function createAlertConfig(data: InsertAlertConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(alertConfigs).values(data);
  return result[0].insertId;
}

export async function getAlertConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(alertConfigs).where(eq(alertConfigs.userId, userId));
}

export async function updateAlertConfig(id: number, data: Partial<InsertAlertConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(alertConfigs).set(data).where(eq(alertConfigs.id, id));
}

export async function deleteAlertConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(alertConfigs).where(eq(alertConfigs.id, id));
}

export async function getActiveAlertConfigs() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(alertConfigs).where(eq(alertConfigs.isActive, true));
}

// ============ ALERT HISTORY ============

export async function createAlertHistoryEntry(data: InsertAlertHistoryEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(alertHistory).values(data);
}

export async function getAlertHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(alertHistory)
    .where(eq(alertHistory.userId, userId))
    .orderBy(desc(alertHistory.createdAt))
    .limit(limit);
}

// ============ REPORTS ============

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reports).values(data);
  return result[0].insertId;
}

export async function getReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));
}

export async function getReport(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReport(id: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(reports).set(data).where(eq(reports.id, id));
}

// ============ AI INSIGHTS ============

export async function createAiInsight(data: InsertAiInsight) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiInsights).values(data);
  return result[0].insertId;
}

export async function getLatestAiInsight(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAiInsights(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(limit);
}

// ============ ORGANIZATIONS ============

export async function createOrganization(data: InsertOrganization) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(organizations).values(data);
  return result[0].insertId;
}

export async function getOrganization(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrganizations() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function getActiveOrganizations() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(organizations)
    .where(eq(organizations.isActive, true))
    .orderBy(organizations.name);
}

export async function updateOrganization(id: number, data: Partial<InsertOrganization>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(organizations).set(data).where(eq(organizations.id, id));
}

export async function deleteOrganization(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(organizations).where(eq(organizations.id, id));
}

// ============ FUNNELS ============

export async function createFunnel(data: InsertFunnel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(funnels).values(data);
  return result[0].insertId;
}

export async function getFunnel(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(funnels).where(eq(funnels.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFunnelsByOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(funnels)
    .where(and(
      eq(funnels.organizationId, organizationId),
      eq(funnels.isActive, true)
    ))
    .orderBy(funnels.order);
}

export async function updateFunnel(id: number, data: Partial<InsertFunnel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(funnels).set(data).where(eq(funnels.id, id));
}

export async function deleteFunnel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(funnels).where(eq(funnels.id, id));
}

// ============ ORGANIZATION USERS ============

export async function addUserToOrganization(data: InsertOrganizationUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(organizationUsers).values(data);
  return result[0].insertId;
}

export async function getUserOrganizations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    organization: organizations,
    role: organizationUsers.role
  })
    .from(organizationUsers)
    .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
    .where(eq(organizationUsers.userId, userId));
}

export async function getOrganizationUsers(organizationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    user: users,
    role: organizationUsers.role
  })
    .from(organizationUsers)
    .innerJoin(users, eq(organizationUsers.userId, users.id))
    .where(eq(organizationUsers.organizationId, organizationId));
}

export async function removeUserFromOrganization(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(organizationUsers)
    .where(and(
      eq(organizationUsers.userId, userId),
      eq(organizationUsers.organizationId, organizationId)
    ));
}

// ============ USER AUTH FUNCTIONS ============

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(data);
  return result[0].insertId;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).orderBy(desc(users.createdAt));
}
