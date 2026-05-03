CREATE TYPE "public"."email_category" AS ENUM('Work', 'Personal', 'Promotions', 'Urgent', 'Other');--> statement-breakpoint
CREATE TYPE "public"."rule_action" AS ENUM('label', 'archive', 'star');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"totalEmails" integer DEFAULT 0 NOT NULL,
	"readEmails" integer DEFAULT 0 NOT NULL,
	"unreadEmails" integer DEFAULT 0 NOT NULL,
	"categoryCounts" jsonb NOT NULL,
	"topSenders" jsonb NOT NULL,
	"avgResponseTime" numeric(10, 2),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"action" varchar(255) NOT NULL,
	"resource" varchar(255),
	"resourceId" varchar(255),
	"details" jsonb,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"emailId" integer NOT NULL,
	"replyText" text NOT NULL,
	"replyIndex" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"emailId" integer NOT NULL,
	"summary" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_summaries_emailId_unique" UNIQUE("emailId")
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"gmailId" varchar(255) NOT NULL,
	"threadId" varchar(255),
	"from" varchar(320) NOT NULL,
	"senderName" varchar(255),
	"to" text,
	"cc" text,
	"bcc" text,
	"subject" text,
	"snippet" text,
	"body" text,
	"category" "email_category" DEFAULT 'Other' NOT NULL,
	"aiScore" integer DEFAULT 50,
	"isRead" boolean DEFAULT false NOT NULL,
	"isStarred" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"hasSummary" boolean DEFAULT false NOT NULL,
	"hasReplySuggestions" boolean DEFAULT false NOT NULL,
	"receivedAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"expiresAt" timestamp with time zone,
	"scope" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"stripePriceId" varchar(255),
	"currentPeriodStart" timestamp with time zone,
	"currentPeriodEnd" timestamp with time zone,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"email" varchar(320),
	"name" text,
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_replies" ADD CONSTRAINT "email_replies_emailId_emails_id_fk" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_summaries" ADD CONSTRAINT "email_summaries_emailId_emails_id_fk" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_tokens" ADD CONSTRAINT "gmail_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_snapshots_userId_idx" ON "analytics_snapshots" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_snapshots_userId_date_idx" ON "analytics_snapshots" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "automation_rules_userId_idx" ON "automation_rules" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "email_replies_emailId_idx" ON "email_replies" USING btree ("emailId");--> statement-breakpoint
CREATE INDEX "email_summaries_emailId_idx" ON "email_summaries" USING btree ("emailId");--> statement-breakpoint
CREATE INDEX "emails_userId_idx" ON "emails" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "emails_gmailId_idx" ON "emails" USING btree ("gmailId");--> statement-breakpoint
CREATE INDEX "emails_userId_gmailId_idx" ON "emails" USING btree ("userId","gmailId");--> statement-breakpoint
CREATE INDEX "emails_receivedAt_idx" ON "emails" USING btree ("receivedAt");--> statement-breakpoint
CREATE INDEX "emails_category_idx" ON "emails" USING btree ("category");--> statement-breakpoint
CREATE INDEX "gmail_tokens_userId_idx" ON "gmail_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "users_openId_idx" ON "users" USING btree ("openId");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");