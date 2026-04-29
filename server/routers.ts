import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as emailSync from "./emailSync";
import * as gmail from "./gmail";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Email management routers
  emails: router({
    // Get inbox emails with pagination
    getInbox: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getEmailsByUserId(ctx.user.id, input.limit, input.offset);
      }),

    // Get single email with full details
    getById: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .query(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });
        return email;
      }),

    // Get priority inbox (AI scored)
    getPriority: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.getPriorityEmails(ctx.user.id, input.limit);
      }),

    // Get emails by category
    getByCategory: protectedProcedure
      .input(z.object({ category: z.enum(["Work", "Personal", "Promotions", "Urgent", "Other"]), limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.getEmailsByCategory(ctx.user.id, input.category, input.limit);
      }),

    // Search emails
    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.searchEmails(ctx.user.id, input.query, input.limit);
      }),

    // Update read status
    updateReadStatus: protectedProcedure
      .input(z.object({ emailId: z.number(), isRead: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateEmailReadStatus(input.emailId, input.isRead);
        return { success: true };
      }),

    // Update starred status
    updateStarred: protectedProcedure
      .input(z.object({ emailId: z.number(), isStarred: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateEmailStarred(input.emailId, input.isStarred);
        return { success: true };
      }),

    // Update category
    updateCategory: protectedProcedure
      .input(z.object({ emailId: z.number(), category: z.enum(["Work", "Personal", "Promotions", "Urgent", "Other"]) }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateEmailCategory(input.emailId, input.category);
        return { success: true };
      }),
  }),

  // AI-powered email features
  ai: router({
    // Categorize email using AI
    categorizeEmail: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an email categorization expert. Categorize the email into one of these categories: Work, Personal, Promotions, Urgent, or Other. Respond with ONLY the category name.",
            },
            {
              role: "user",
              content: `Subject: ${email.subject}\n\nFrom: ${email.from}\n\nContent: ${email.snippet || email.body}`,
            },
          ],
        });

        const categoryStr = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : '';
        const category = categoryStr.trim() || "Other";
        await db.updateEmailCategory(input.emailId, category);

        return { category };
      }),

    // Generate email summary
    summarizeEmail: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });

        // Check if summary already exists
        const existing = await db.getSummary(input.emailId);
        if (existing) return { summary: existing.summary };

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a concise email summarizer. Provide a brief 1-2 sentence summary of the email content. Be direct and capture the key message.",
            },
            {
              role: "user",
              content: `Subject: ${email.subject}\n\nContent: ${email.body || email.snippet}`,
            },
          ],
        });

        const summaryStr = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : '';
        const summary = summaryStr.trim() || "";
        await db.saveSummary(input.emailId, summary);

        return { summary };
      }),

    // Generate reply suggestions
    generateReplies: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });

        // Check if replies already exist
        const existing = await db.getReplySuggestions(input.emailId);
        if (existing.length > 0) {
          return { replies: existing.map((r: any) => r.replyText) };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a professional email assistant. Generate exactly 3 different reply suggestions for the given email. Each reply should be professional, concise, and contextually appropriate. Format your response as three separate numbered replies (1., 2., 3.).",
            },
            {
              role: "user",
              content: `Email from: ${email.from}\nSubject: ${email.subject}\n\nContent: ${email.body || email.snippet}\n\nGenerate 3 reply suggestions:`,
            },
          ],
        });

        const contentStr = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : '';
        const content = contentStr.trim() || "";
        const replies = content
          .split(/\d+\.\s+/)
          .filter((r: string) => r.trim())
          .slice(0, 3)
          .map((r: string) => r.trim());

        if (replies.length > 0) {
          await db.saveReplySuggestions(input.emailId, replies);
        }

        return { replies };
      }),

    // Score email priority
    scoreEmailPriority: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId, ctx.user.id);
        if (!email) throw new TRPCError({ code: "NOT_FOUND" });

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an email priority scorer. Rate the importance of this email on a scale of 0-100, where 100 is extremely urgent and important, and 0 is not important. Consider urgency indicators, sender importance, and content relevance. Respond with ONLY a number between 0 and 100.",
            },
            {
              role: "user",
              content: `From: ${email.from}\nSubject: ${email.subject}\n\nContent: ${email.snippet || email.body}`,
            },
          ],
        });

        const contentStr = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : '';
        const score = parseInt(contentStr.trim() || "50", 10);
        const aiScore = Math.max(0, Math.min(100, score));

        // Update email with AI score
        // Note: We'll need to add this to the db functions
        return { score: aiScore };
      }),
  }),

  // Automation rules
  rules: router({
    // Get all rules for user
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getRulesByUserId(ctx.user.id);
    }),

    // Create new rule
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        condition: z.object({ type: z.enum(["from", "subject", "to"]), value: z.string() }),
        action: z.object({ type: z.enum(["label", "archive", "star"]), value: z.string() }),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createRule(ctx.user.id, input.name, input.condition, input.action);
        return { success: true };
      }),

    // Update rule
    update: protectedProcedure
      .input(z.object({
        ruleId: z.number(),
        updates: z.object({
          name: z.string().optional(),
          condition: z.any().optional(),
          action: z.any().optional(),
          isActive: z.number().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateRule(input.ruleId, input.updates);
        return { success: true };
      }),

    // Delete rule
    delete: protectedProcedure
      .input(z.object({ ruleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteRule(input.ruleId);
        return { success: true };
      }),
  }),

  // Email sync and compose
  sync: router({
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
  }),

  // Analytics
  analytics: router({
    // Get analytics for date range
    getForDateRange: protectedProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getAnalyticsForDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    // Get top senders
    getTopSenders: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return db.getTopSenders(ctx.user.id, input.limit);
      }),

    // Get category distribution
    getCategoryDistribution: protectedProcedure.query(async ({ ctx }) => {
      const categories = ["Work", "Personal", "Promotions", "Urgent", "Other"] as const;
      const distribution: Record<string, number> = {};

      for (const category of categories) {
        const emails = await db.getEmailsByCategory(ctx.user.id, category, 1000);
        distribution[category] = emails.length;
      }

      return distribution;
    }),
  }),
});

export type AppRouter = typeof appRouter;
