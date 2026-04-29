import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const emails = mysqlTable("emails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  gmailId: varchar("gmailId", { length: 255 }).notNull().unique(),
  threadId: varchar("threadId", { length: 255 }).notNull(),
  from: varchar("from", { length: 320 }).notNull(),
  senderName: varchar("senderName", { length: 255 }),
  to: text("to").notNull(), // JSON array
  cc: text("cc"), // JSON array
  bcc: text("bcc"), // JSON array
  subject: text("subject"),
  snippet: text("snippet"),
  body: text("body"),
  isRead: int("isRead").default(0).notNull(),
  isStarred: int("isStarred").default(0).notNull(),
  category: mysqlEnum("category", ["Work", "Personal", "Promotions", "Urgent", "Other"]).default("Other"),
  aiScore: int("aiScore").default(0), // 0-100 priority score
  hasSummary: int("hasSummary").default(0),
  hasReplySuggestions: int("hasReplySuggestions").default(0),
  receivedAt: timestamp("receivedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

export const emailSummaries = mysqlTable("emailSummaries", {
  id: int("id").autoincrement().primaryKey(),
  emailId: int("emailId").notNull().references(() => emails.id),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailSummary = typeof emailSummaries.$inferSelect;
export type InsertEmailSummary = typeof emailSummaries.$inferInsert;

export const emailReplies = mysqlTable("emailReplies", {
  id: int("id").autoincrement().primaryKey(),
  emailId: int("emailId").notNull().references(() => emails.id),
  replyText: text("replyText").notNull(),
  replyIndex: int("replyIndex").notNull(), // 0, 1, or 2 for the three suggestions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailReply = typeof emailReplies.$inferSelect;
export type InsertEmailReply = typeof emailReplies.$inferInsert;

export const automationRules = mysqlTable("automationRules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  condition: text("condition").notNull(), // JSON: { type: 'from'|'subject'|'to', value: string }
  action: text("action").notNull(), // JSON: { type: 'label'|'archive'|'star', value: string }
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

export const analyticsSnapshots = mysqlTable("analyticsSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  emailCount: int("emailCount").default(0),
  workCount: int("workCount").default(0),
  personalCount: int("personalCount").default(0),
  promotionsCount: int("promotionsCount").default(0),
  urgentCount: int("urgentCount").default(0),
  averageResponseTime: int("averageResponseTime").default(0), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;