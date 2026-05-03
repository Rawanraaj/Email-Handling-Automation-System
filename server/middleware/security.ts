import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

/**
 * Security Middleware Suite for Azlor
 * - Rate limiting
 * - Security headers
 * - Input sanitization
 * - CSRF protection
 */

// ============================================================================
// RATE LIMITING
// ============================================================================

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true,
});

export const emailSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 emails per hour
  message: "Email sending limit exceeded",
});

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.azlor.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  noSniff: true,
  xssFilter: true,
});

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return purify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeInput(email);
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized.toLowerCase() : "";
}

export function validateEmailList(emails: string): string[] {
  return emails
    .split(",")
    .map((e) => sanitizeEmail(e.trim()))
    .filter((e) => e.length > 0);
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLogData {
  userId: number;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  // Log to database (implement in your audit log service)
  console.log("[AUDIT]", JSON.stringify(data));
}

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Attach audit info to request
  (req as any).auditInfo = {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
    timestamp: new Date(),
  };
  next();
}

export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method === "POST" || req.method === "PUT") {
    const contentType = req.get("content-type");
    if (!contentType?.includes("application/json")) {
      return res.status(400).json({ error: "Content-Type must be application/json" });
    }
  }
  next();
}

export function preventCsrf(req: Request, res: Response, next: NextFunction) {
  // CSRF token validation (implement with express-csrf or similar)
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const token = req.get("x-csrf-token");
    if (!token) {
      return res.status(403).json({ error: "CSRF token required" });
    }
  }
  next();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[ERROR]", err);

  // Don't leak error details to client
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { details: err.stack }),
  });
}

// ============================================================================
// SUBSCRIPTION TIER ENFORCEMENT
// ============================================================================

export interface TierLimits {
  free: { emailsPerDay: number; rulesLimit: number; storageGB: number };
  pro: { emailsPerDay: number; rulesLimit: number; storageGB: number };
  enterprise: { emailsPerDay: number; rulesLimit: number; storageGB: number };
}

export const TIER_LIMITS: TierLimits = {
  free: {
    emailsPerDay: 50,
    rulesLimit: 5,
    storageGB: 1,
  },
  pro: {
    emailsPerDay: 10000,
    rulesLimit: 50,
    storageGB: 100,
  },
  enterprise: {
    emailsPerDay: 999999,
    rulesLimit: 999999,
    storageGB: 10000,
  },
};

export function checkTierLimit(
  tier: string,
  limitType: keyof typeof TIER_LIMITS.free,
  currentUsage: number
): boolean {
  const limits = TIER_LIMITS[tier as keyof TierLimits];
  if (!limits) return false;
  return currentUsage < limits[limitType];
}
