-- Add performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_emails_userId ON emails("userId");
CREATE INDEX IF NOT EXISTS idx_emails_receivedAt ON emails("receivedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails("from");
CREATE INDEX IF NOT EXISTS idx_emails_userId_receivedAt ON emails("userId", "receivedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_emailId ON summaries("emailId");
CREATE INDEX IF NOT EXISTS idx_replies_emailId ON replies("emailId");
CREATE INDEX IF NOT EXISTS idx_analytics_userId ON analytics("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_userId ON gmail_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_rules_userId ON automation_rules("userId");
