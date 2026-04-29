import { eq, and, desc, gte, lte, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, emails, emailSummaries, emailReplies, automationRules, analyticsSnapshots, Email, EmailSummary, EmailReply, AutomationRule, AnalyticsSnapshot } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

// Email management queries
export async function upsertEmail(email: typeof emails.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emails).values(email).onDuplicateKeyUpdate({
    set: {
      subject: email.subject,
      snippet: email.snippet,
      body: email.body,
      isRead: email.isRead,
      isStarred: email.isStarred,
      category: email.category,
      aiScore: email.aiScore,
      updatedAt: new Date(),
    },
  });
}

export async function getEmailsByUserId(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId))
    .orderBy(desc(emails.receivedAt))
    .limit(limit)
    .offset(offset);
}

export async function getEmailById(emailId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emails)
    .where(and(eq(emails.id, emailId), eq(emails.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateEmailCategory(emailId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emails).set({ category: category as any }).where(eq(emails.id, emailId));
}

export async function updateEmailReadStatus(emailId: number, isRead: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emails).set({ isRead: isRead ? 1 : 0 }).where(eq(emails.id, emailId));
}

export async function updateEmailStarred(emailId: number, isStarred: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emails).set({ isStarred: isStarred ? 1 : 0 }).where(eq(emails.id, emailId));
}

export async function getEmailsByCategory(userId: number, category: string, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(emails)
    .where(and(eq(emails.userId, userId), eq(emails.category, category as any)))
    .orderBy(desc(emails.receivedAt))
    .limit(limit);
}

export async function getPriorityEmails(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId))
    .orderBy(desc(emails.aiScore), desc(emails.receivedAt))
    .limit(limit);
}

export async function searchEmails(userId: number, query: string, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        like(emails.subject, `%${query}%`)
      )
    )
    .orderBy(desc(emails.receivedAt))
    .limit(limit);
}

// Email summary queries
export async function saveSummary(emailId: number, summary: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailSummaries).values({ emailId, summary });
  await db.update(emails).set({ hasSummary: 1 }).where(eq(emails.id, emailId));
}

export async function getSummary(emailId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emailSummaries)
    .where(eq(emailSummaries.emailId, emailId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Email reply suggestions queries
export async function saveReplySuggestions(emailId: number, replies: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (let i = 0; i < replies.length; i++) {
    await db.insert(emailReplies).values({
      emailId,
      replyText: replies[i],
      replyIndex: i,
    });
  }
  await db.update(emails).set({ hasReplySuggestions: 1 }).where(eq(emails.id, emailId));
}

export async function getReplySuggestions(emailId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(emailReplies)
    .where(eq(emailReplies.emailId, emailId))
    .orderBy(emailReplies.replyIndex);
}

// Automation rules queries
export async function createRule(userId: number, name: string, condition: any, action: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(automationRules).values({
    userId,
    name,
    condition: JSON.stringify(condition),
    action: JSON.stringify(action),
  });
}

export async function getRulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(automationRules)
    .where(and(eq(automationRules.userId, userId), eq(automationRules.isActive, 1)));
}

export async function updateRule(ruleId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(automationRules).set(updates).where(eq(automationRules.id, ruleId));
}

export async function deleteRule(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(automationRules).set({ isActive: 0 }).where(eq(automationRules.id, ruleId));
}

// Analytics queries
export async function saveAnalyticsSnapshot(userId: number, date: string, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(analyticsSnapshots).values({
    userId,
    date,
    ...data,
  });
}

export async function getAnalyticsForDateRange(userId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(analyticsSnapshots)
    .where(
      and(
        eq(analyticsSnapshots.userId, userId),
        gte(analyticsSnapshots.date, startDate),
        lte(analyticsSnapshots.date, endDate)
      )
    )
    .orderBy(analyticsSnapshots.date);
}

export async function getTopSenders(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // This is a simplified version - in production you'd use raw SQL for aggregation
  const allEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId));

  const senderMap = new Map<string, { name: string; count: number }>();
  allEmails.forEach((email) => {
    const current = senderMap.get(email.from) || { name: email.senderName || email.from, count: 0 };
    senderMap.set(email.from, { ...current, count: current.count + 1 });
  });

  return Array.from(senderMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
