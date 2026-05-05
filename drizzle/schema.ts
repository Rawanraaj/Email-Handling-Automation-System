import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  index,
  integer,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * PostgreSQL Schema for Azlor Email Automation Platform
 * All timestamps in UTC, all IDs are serial (auto-increment)
 */

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const emailCategoryEnum = pgEnum("email_category", [
  "Work",
  "Personal",
  "Promotions",
  "Urgent",
  "Other",
]);
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "enterprise",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);
export const ruleActionEnum = pgEnum("rule_action", [
  "label",
  "archive",
  "star",
]);

// ============================================================================
// CORE TABLES
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }).unique(),
    name: text("name"),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: userRoleEnum("role").default("user").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    openIdIdx: index("users_openId_idx").on(table.openId),
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// GMAIL INTEGRATION TABLES
// ============================================================================

export const gmailTokens = pgTable(
  "gmail_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("accessToken").notNull(), // Encrypted
    refreshToken: text("refreshToken"), // Encrypted
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    scope: text("scope").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("gmail_tokens_userId_idx").on(table.userId),
  })
);

export type GmailToken = typeof gmailTokens.$inferSelect;
export type InsertGmailToken = typeof gmailTokens.$inferInsert;

export const emails = pgTable(
  "emails",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gmailId: varchar("gmailId", { length: 255 }).notNull(), // Gmail message ID
    threadId: varchar("threadId", { length: 255 }), // Gmail thread ID
    from: varchar("from", { length: 320 }).notNull(),
    senderName: varchar("senderName", { length: 255 }),
    to: text("to"), // JSON array of recipients
    cc: text("cc"), // JSON array
    bcc: text("bcc"), // JSON array
    subject: text("subject"),
    snippet: text("snippet"),
    body: text("body"), // Full email body
    category: emailCategoryEnum("category").default("Other").notNull(),
    aiScore: integer("aiScore").default(50), // 0-100 priority score
    isRead: boolean("isRead").default(false).notNull(),
    isStarred: boolean("isStarred").default(false).notNull(),
    isArchived: boolean("isArchived").default(false).notNull(),
    hasSummary: boolean("hasSummary").default(false).notNull(),
    hasReplySuggestions: boolean("hasReplySuggestions").default(false).notNull(),
    receivedAt: timestamp("receivedAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("emails_userId_idx").on(table.userId),
    gmailIdIdx: index("emails_gmailId_idx").on(table.gmailId),
    userGmailIdIdx: index("emails_userId_gmailId_idx").on(
      table.userId,
      table.gmailId
    ),
    receivedAtIdx: index("emails_receivedAt_idx").on(table.receivedAt),
    categoryIdx: index("emails_category_idx").on(table.category),
  })
);

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

export const emailSummaries = pgTable(
  "email_summaries",
  {
    id: serial("id").primaryKey(),
    emailId: integer("emailId")
      .notNull()
      .unique()
      .references(() => emails.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdIdx: index("email_summaries_emailId_idx").on(table.emailId),
  })
);

export type EmailSummary = typeof emailSummaries.$inferSelect;
export type InsertEmailSummary = typeof emailSummaries.$inferInsert;

export const emailReplies = pgTable(
  "email_replies",
  {
    id: serial("id").primaryKey(),
    emailId: integer("emailId")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    replyText: text("replyText").notNull(),
    replyIndex: integer("replyIndex").notNull(), // 0, 1, 2 for first, second, third suggestion
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdIdx: index("email_replies_emailId_idx").on(table.emailId),
  })
);

export type EmailReply = typeof emailReplies.$inferSelect;
export type InsertEmailReply = typeof emailReplies.$inferInsert;

// ============================================================================
// AUTOMATION RULES TABLE
// ============================================================================

export const automationRules = pgTable(
  "automation_rules",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    // Conditions (JSON)
    conditions: jsonb("conditions").notNull(), // { fromEmail?: string, subject?: string, recipient?: string }
    // Actions (JSON)
    actions: jsonb("actions").notNull(), // { labels?: string[], archive?: boolean, star?: boolean }
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("automation_rules_userId_idx").on(table.userId),
  })
);

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

// ============================================================================
// ANALYTICS TABLE
// ============================================================================

export const analyticsSnapshots = pgTable(
  "analytics_snapshots",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    totalEmails: integer("totalEmails").default(0).notNull(),
    readEmails: integer("readEmails").default(0).notNull(),
    unreadEmails: integer("unreadEmails").default(0).notNull(),
    categoryCounts: jsonb("categoryCounts").notNull(), // { Work: n, Personal: n, ... }
    topSenders: jsonb("topSenders").notNull(), // [{ email, count }, ...]
    avgResponseTime: decimal("avgResponseTime", { precision: 10, scale: 2 }), // minutes
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("analytics_snapshots_userId_idx").on(table.userId),
    userDateIdx: index("analytics_snapshots_userId_date_idx").on(
      table.userId,
      table.date
    ),
  })
);

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;

// ============================================================================
// SUBSCRIPTION TABLE
// ============================================================================

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: subscriptionTierEnum("tier").default("free").notNull(),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
    stripePriceId: varchar("stripePriceId", { length: 255 }),
    currentPeriodStart: timestamp("currentPeriodStart", { withTimezone: true }),
    currentPeriodEnd: timestamp("currentPeriodEnd", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("subscriptions_userId_idx").on(table.userId),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ============================================================================
// AUDIT LOG TABLE
// ============================================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 255 }).notNull(), // login, logout, email_sent, rule_created, etc
    resource: varchar("resource", { length: 255 }), // email, rule, subscription, etc
    resourceId: varchar("resourceId", { length: 255 }),
    details: jsonb("details"), // Additional context
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_userId_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// CUSTOMER SERVICE TABLES (new)
// ============================================================================

export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "agent", "viewer"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "frustrated", "angry"]);

export const workspaces = pgTable(
  "workspaces",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionTierEnum("plan").default("free").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({ ownerIdx: index("workspaces_ownerId_idx").on(table.ownerId) })
);
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").default("agent").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("team_members_workspaceId_idx").on(table.workspaceId),
    userIdx: index("team_members_userId_idx").on(table.userId),
  })
);
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 255 }),
    totalTickets: integer("totalTickets").default(0).notNull(),
    resolvedTickets: integer("resolvedTickets").default(0).notNull(),
    sentimentHistory: jsonb("sentimentHistory"), // Array of recent sentiments
    lastContactedAt: timestamp("lastContactedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("customer_profiles_workspaceId_idx").on(table.workspaceId),
    emailIdx: index("customer_profiles_email_idx").on(table.email),
  })
);
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    emailId: integer("emailId").references(() => emails.id, { onDelete: "set null" }),
    customerId: integer("customerId").references(() => customerProfiles.id, { onDelete: "set null" }),
    assignedTo: integer("assignedTo").references(() => users.id, { onDelete: "set null" }),
    subject: text("subject"),
    status: ticketStatusEnum("status").default("open").notNull(),
    priority: ticketPriorityEnum("priority").default("medium").notNull(),
    sentiment: sentimentEnum("sentiment").default("neutral"),
    slaDeadline: timestamp("slaDeadline", { withTimezone: true }),
    firstResponseAt: timestamp("firstResponseAt", { withTimezone: true }),
    resolvedAt: timestamp("resolvedAt", { withTimezone: true }),
    closedAt: timestamp("closedAt", { withTimezone: true }),
    tags: jsonb("tags"), // string[]
    notes: text("notes"), // internal agent notes
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("tickets_workspaceId_idx").on(table.workspaceId),
    statusIdx: index("tickets_status_idx").on(table.status),
    assignedToIdx: index("tickets_assignedTo_idx").on(table.assignedTo),
    slaIdx: index("tickets_slaDeadline_idx").on(table.slaDeadline),
  })
);
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 100 }),
    usageCount: integer("usageCount").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdBy: integer("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("knowledge_base_workspaceId_idx").on(table.workspaceId),
    categoryIdx: index("knowledge_base_category_idx").on(table.category),
  })
);
export type KnowledgeBaseArticle = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseArticle = typeof knowledgeBase.$inferInsert;
