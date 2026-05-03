import { log } from "./logger";
import { db } from "./db-pool";
import { auditLogs } from "../drizzle/schema";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function logSecurityEvent(
  event:
    | "LOGIN"
    | "LOGOUT"
    | "FAILED_LOGIN"
    | "TOKEN_REFRESH"
    | "UNAUTHORIZED_ACCESS",
  userId: string,
  metadata?: object
) {
  log.security(event, userId, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });

  // Write to audit_logs table
  try {
    await db.insert(auditLogs).values({
      userId: parseInt(userId),
      action: event,
      details: metadata,
      createdAt: new Date(),
    });
  } catch (err) {
    log.error("Failed to write audit log", err);
  }
}

export function isSessionExpired(lastActivityTime: number): boolean {
  const now = Date.now();
  return now - lastActivityTime > SESSION_TIMEOUT_MS;
}
