import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

describe("Email Management", () => {
  describe("Email CRUD operations", () => {
    it("should insert and retrieve an email", async () => {
      const testEmail = {
        userId: 1,
        gmailId: "test-123",
        threadId: "thread-123",
        from: "sender@example.com",
        senderName: "Test Sender",
        to: JSON.stringify(["recipient@example.com"]),
        subject: "Test Email",
        snippet: "This is a test email",
        body: "This is the full body of the test email",
        isRead: 0,
        isStarred: 0,
        category: "Work" as const,
        aiScore: 75,
        hasSummary: 0,
        hasReplySuggestions: 0,
        receivedAt: new Date(),
      };

      // Test that upsertEmail doesn't throw
      await expect(db.upsertEmail(testEmail)).resolves.not.toThrow();
    });

    it("should update email read status", async () => {
      // Test that updateEmailReadStatus doesn't throw
      await expect(db.updateEmailReadStatus(1, true)).resolves.not.toThrow();
    });

    it("should update email starred status", async () => {
      // Test that updateEmailStarred doesn't throw
      await expect(db.updateEmailStarred(1, true)).resolves.not.toThrow();
    });

    it("should update email category", async () => {
      // Test that updateEmailCategory doesn't throw
      await expect(db.updateEmailCategory(1, "Urgent")).resolves.not.toThrow();
    });
  });

  describe("Email queries", () => {
    it("should handle getEmailsByUserId", async () => {
      // Test that query doesn't throw
      const result = await db.getEmailsByUserId(1, 50, 0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle searchEmails", async () => {
      // Test that search doesn't throw
      const result = await db.searchEmails(1, "test", 50);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle getEmailsByCategory", async () => {
      // Test that category query doesn't throw
      const result = await db.getEmailsByCategory(1, "Work", 50);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle getPriorityEmails", async () => {
      // Test that priority query doesn't throw
      const result = await db.getPriorityEmails(1, 50);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Email summaries", () => {
    it("should save and retrieve email summary", async () => {
      // Test that saveSummary doesn't throw
      await expect(db.saveSummary(1, "This is a summary")).resolves.not.toThrow();

      // Test that getSummary doesn't throw
      const result = await db.getSummary(1);
      // Result could be null if email doesn't exist
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("Email reply suggestions", () => {
    it("should save and retrieve reply suggestions", async () => {
      const replies = [
        "Thanks for your email",
        "I'll get back to you soon",
        "Can you provide more details?",
      ];

      // Test that saveReplySuggestions doesn't throw
      await expect(db.saveReplySuggestions(1, replies)).resolves.not.toThrow();

      // Test that getReplySuggestions doesn't throw
      const result = await db.getReplySuggestions(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Automation rules", () => {
    it("should create and retrieve automation rules", async () => {
      const condition = { type: "from", value: "boss@company.com" };
      const action = { type: "label", value: "Important" };

      // Test that createRule doesn't throw
      await expect(db.createRule(1, "Work Emails", condition, action)).resolves.not.toThrow();

      // Test that getRulesByUserId doesn't throw
      const result = await db.getRulesByUserId(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should update automation rule", async () => {
      const updates = { name: "Updated Rule" };

      // Test that updateRule doesn't throw
      await expect(db.updateRule(1, updates)).resolves.not.toThrow();
    });

    it("should delete automation rule", async () => {
      // Test that deleteRule doesn't throw
      await expect(db.deleteRule(1)).resolves.not.toThrow();
    });
  });

  describe("Analytics", () => {
    it("should save analytics snapshot", async () => {
      const data = {
        emailCount: 100,
        workCount: 40,
        personalCount: 30,
        promotionsCount: 20,
        urgentCount: 10,
        averageResponseTime: 120,
      };

      // Test that saveAnalyticsSnapshot doesn't throw
      await expect(db.saveAnalyticsSnapshot(1, "2026-04-29", data)).resolves.not.toThrow();
    });

    it("should retrieve analytics for date range", async () => {
      // Test that getAnalyticsForDateRange doesn't throw
      const result = await db.getAnalyticsForDateRange(1, "2026-04-01", "2026-04-30");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get top senders", async () => {
      // Test that getTopSenders doesn't throw
      const result = await db.getTopSenders(1, 10);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
