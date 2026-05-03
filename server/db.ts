import { eq, and, desc, gte, lte, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  emails,
  emailSummaries,
  emailReplies,
  automationRules,
  analyticsSnapshots,
  subscriptions,
  auditLogs,
  gmailTokens,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

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

    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      if (user[field] !== undefined) {
        values[field] = user[field];
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: values.name,
          email: values.email,
          loginMethod: values.loginMethod,
          role: values.role,
          lastSignedIn: values.lastSignedIn,
          updatedAt: new Date(),
        },
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// EMAIL OPERATIONS
// ============================================================================

export async function createEmail(email: typeof emails.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emails).values(email).returning();
  return result[0];
}

export async function getEmailsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId))
    .orderBy(desc(emails.receivedAt))
    .limit(limit);
}

export async function getEmailById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(emails)
    .where(eq(emails.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateEmail(
  id: number,
  updates: Partial<typeof emails.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(emails)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(emails.id, id));
}

export async function getEmailsByCategory(userId: number, category: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emails)
    .where(and(eq(emails.userId, userId), eq(emails.category, category as any)))
    .orderBy(desc(emails.receivedAt));
}

export async function searchEmails(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        or(
          query ? like(emails.subject, `%${query}%`) : undefined,
          query ? like(emails.body, `%${query}%`) : undefined,
          query ? like(emails.from, `%${query}%`) : undefined
        )
      )
    )
    .orderBy(desc(emails.receivedAt));
}

// ============================================================================
// EMAIL SUMMARY OPERATIONS
// ============================================================================

export async function createEmailSummary(
  emailId: number,
  summary: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(emailSummaries)
    .values({ emailId, summary })
    .returning();
  return result[0];
}

export async function getEmailSummary(emailId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(emailSummaries)
    .where(eq(emailSummaries.emailId, emailId))
    .limit(1);
  return result[0] || null;
}

// ============================================================================
// EMAIL REPLY OPERATIONS
// ============================================================================

export async function createEmailReply(
  emailId: number,
  replyText: string,
  replyIndex: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(emailReplies)
    .values({ emailId, replyText, replyIndex })
    .returning();
  return result[0];
}

export async function getEmailReplies(emailId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailReplies)
    .where(eq(emailReplies.emailId, emailId))
    .orderBy(emailReplies.replyIndex);
}

// ============================================================================
// AUTOMATION RULES OPERATIONS
// ============================================================================

export async function createRule(
  userId: number,
  name: string,
  description: string | undefined,
  conditions: any,
  actions: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(automationRules)
    .values({
      userId,
      name,
      description,
      conditions,
      actions,
      isActive: true,
    })
    .returning();
  return result[0];
}

export async function getRulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.userId, userId));
}

export async function updateRule(
  id: number,
  updates: Partial<typeof automationRules.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(automationRules)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(automationRules.id, id));
}

export async function deleteRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(automationRules).where(eq(automationRules.id, id));
}

// ============================================================================
// ANALYTICS OPERATIONS
// ============================================================================

export async function createAnalyticsSnapshot(
  snapshot: typeof analyticsSnapshots.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(analyticsSnapshots)
    .values(snapshot)
    .returning();
  return result[0];
}

export async function getAnalyticsForUser(userId: number, daysBack: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return await db
    .select()
    .from(analyticsSnapshots)
    .where(
      and(
        eq(analyticsSnapshots.userId, userId),
        gte(analyticsSnapshots.date, startDate)
      )
    )
    .orderBy(desc(analyticsSnapshots.date));
}

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

export async function createSubscription(
  subscription: typeof subscriptions.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(subscriptions)
    .values(subscription)
    .returning();
  return result[0];
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function updateSubscription(
  userId: number,
  updates: Partial<typeof subscriptions.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(subscriptions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}

// ============================================================================
// AUDIT LOG OPERATIONS
// ============================================================================

export async function createAuditLog(log: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(auditLogs).values(log).returning();
  return result[0];
}

export async function getAuditLogsForUser(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ============================================================================
// GMAIL TOKEN OPERATIONS
// ============================================================================

export async function getGmailTokenByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(gmailTokens)
    .where(eq(gmailTokens.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function createGmailToken(
  token: typeof gmailTokens.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(gmailTokens).values(token).returning();
  return result[0];
}
