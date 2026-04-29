// Extended routers for email sync and compose operations
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as emailSync from "./emailSync";
import * as gmail from "./gmail";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const emailSyncRouter = router({
  // Sync emails from Gmail
  syncGmail: protectedProcedure
    .input(z.object({ maxResults: z.number().default(50) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await emailSync.syncGmailEmails(ctx.user.id, input.maxResults);
        return result;
      } catch (error) {
        console.error("Gmail sync error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync emails from Gmail",
        });
      }
    }),

  // Compose and send email
  sendEmail: protectedProcedure
    .input(z.object({
      to: z.array(z.string().email()),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
      subject: z.string(),
      content: z.string(),
      threadId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await gmail.sendGmailMessage(
          input.to,
          input.subject,
          input.content,
          {
            cc: input.cc,
            bcc: input.bcc,
            threadId: input.threadId,
          }
        );
        return result;
      } catch (error) {
        console.error("Email send error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  // Save email as draft
  saveDraft: protectedProcedure
    .input(z.object({
      to: z.array(z.string().email()),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
      subject: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Implement draft saving via Gmail MCP
        return { success: true, draftId: "draft-" + Date.now() };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save draft",
        });
      }
    }),

  // Apply automation rules to email
  applyRules: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const email = await db.getEmailById(input.emailId, ctx.user.id);
      if (!email) throw new TRPCError({ code: "NOT_FOUND" });

      await emailSync.applyAutomationRules(ctx.user.id, input.emailId);
      return { success: true };
    }),

  // Generate daily analytics
  generateDailyAnalytics: protectedProcedure
    .mutation(async ({ ctx }) => {
      await emailSync.generateDailyAnalytics(ctx.user.id);
      return { success: true };
    }),

  // Get Gmail labels
  getLabels: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const result = await gmail.manageGmailLabels("list");
        return result;
      } catch (error) {
        console.error("Failed to get labels:", error);
        return { labels: [] };
      }
    }),

  // Create Gmail label
  createLabel: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await gmail.manageGmailLabels("create", { name: input.name });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create label",
        });
      }
    }),

  // Apply label to emails
  applyLabel: protectedProcedure
    .input(z.object({
      labelId: z.string(),
      messageIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await gmail.manageGmailLabels("apply", {
          labelId: input.labelId,
          messageIds: input.messageIds,
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to apply label",
        });
      }
    }),
});
