-- Migration: Add customer service tables for AZLOR SaaS
-- Run this after existing migrations

-- Enums
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'agent', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE sentiment AS ENUM ('positive', 'neutral', 'frustrated', 'angry');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Workspaces
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "ownerId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "plan" subscription_tier DEFAULT 'free' NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "workspaces_ownerId_idx" ON "workspaces"("ownerId");

-- Team Members
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" serial PRIMARY KEY,
  "workspaceId" integer NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" workspace_role DEFAULT 'agent' NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "team_members_workspaceId_idx" ON "team_members"("workspaceId");
CREATE INDEX IF NOT EXISTS "team_members_userId_idx" ON "team_members"("userId");

-- Customer Profiles
CREATE TABLE IF NOT EXISTS "customer_profiles" (
  "id" serial PRIMARY KEY,
  "workspaceId" integer NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "email" varchar(320) NOT NULL,
  "name" varchar(255),
  "totalTickets" integer DEFAULT 0 NOT NULL,
  "resolvedTickets" integer DEFAULT 0 NOT NULL,
  "sentimentHistory" jsonb,
  "lastContactedAt" timestamptz,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "customer_profiles_workspaceId_idx" ON "customer_profiles"("workspaceId");
CREATE INDEX IF NOT EXISTS "customer_profiles_email_idx" ON "customer_profiles"("email");

-- Tickets
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" serial PRIMARY KEY,
  "workspaceId" integer NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "emailId" integer REFERENCES "emails"("id") ON DELETE SET NULL,
  "customerId" integer REFERENCES "customer_profiles"("id") ON DELETE SET NULL,
  "assignedTo" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "subject" text,
  "status" ticket_status DEFAULT 'open' NOT NULL,
  "priority" ticket_priority DEFAULT 'medium' NOT NULL,
  "sentiment" sentiment DEFAULT 'neutral',
  "slaDeadline" timestamptz,
  "firstResponseAt" timestamptz,
  "resolvedAt" timestamptz,
  "closedAt" timestamptz,
  "tags" jsonb,
  "notes" text,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "tickets_workspaceId_idx" ON "tickets"("workspaceId");
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets"("status");
CREATE INDEX IF NOT EXISTS "tickets_assignedTo_idx" ON "tickets"("assignedTo");
CREATE INDEX IF NOT EXISTS "tickets_slaDeadline_idx" ON "tickets"("slaDeadline");

-- Knowledge Base
CREATE TABLE IF NOT EXISTS "knowledge_base" (
  "id" serial PRIMARY KEY,
  "workspaceId" integer NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "content" text NOT NULL,
  "category" varchar(100),
  "usageCount" integer DEFAULT 0 NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdBy" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "knowledge_base_workspaceId_idx" ON "knowledge_base"("workspaceId");
CREATE INDEX IF NOT EXISTS "knowledge_base_category_idx" ON "knowledge_base"("category");
