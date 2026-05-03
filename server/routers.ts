import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { aiAssistantRouter } from "./aiRoutes";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

export const appRouter = router({
  system: systemRouter,

  // ========================================================================
  // AUTH ROUTES
  // ========================================================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ========================================================================
  // EMAIL ROUTES
  // ========================================================================
  emails: router({
    // Get all emails for user
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getEmailsByUserId(ctx.user.id, input?.limit || 50);
      }),

    // Get email by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.id);
        if (!email || email.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return email;
      }),

    // Get emails by category
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getEmailsByCategory(ctx.user.id, input.category);
      }),

    // Search emails
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.searchEmails(ctx.user.id, input.query);
      }),

    // Update email (mark read, star, etc)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          isRead: z.boolean().optional(),
          isStarred: z.boolean().optional(),
          isArchived: z.boolean().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.id);
        if (!email || email.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await db.updateEmail(input.id, {
          isRead: input.isRead,
          isStarred: input.isStarred,
          isArchived: input.isArchived,
          category: input.category as any,
        });

        return { success: true };
      }),
  }),

  // ========================================================================
  // AI FEATURES ROUTES
  // ========================================================================
  ai: router({
    // Categorize email
    categorizeEmail: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId);
        if (!email || email.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an email categorizer. Categorize the email into one of these categories: Work, Personal, Promotions, Urgent, Other. Respond with ONLY the category name.",
            },
            {
              role: "user",
              content: `From: ${email.from}\nSubject: ${email.subject}\n\nContent: ${email.snippet || email.body}`,
            },
          ],
        });

        const category = (
          typeof response.choices[0]?.message.content === "string"
            ? response.choices[0].message.content
            : "Other"
        )
          .trim()
          .toLowerCase();

        const validCategories = ["work", "personal", "promotions", "urgent", "other"];
        const finalCategory = validCategories.includes(category)
          ? (category.charAt(0).toUpperCase() + category.slice(1) as any)
          : "Other";

        await db.updateEmail(input.emailId, { category: finalCategory });

        return { category: finalCategory };
      }),

    // Summarize email
    summarizeEmail: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId);
        if (!email || email.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Check if summary already exists
        const existing = await db.getEmailSummary(input.emailId);
        if (existing) {
          return { summary: existing.summary };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an email summarizer. Provide a concise 2-3 sentence summary of the email content.",
            },
            {
              role: "user",
              content: `From: ${email.from}\nSubject: ${email.subject}\n\nContent: ${email.body || email.snippet}`,
            },
          ],
        });

        const summary =
          typeof response.choices[0]?.message.content === "string"
            ? response.choices[0].message.content
            : "";

        await db.createEmailSummary(input.emailId, summary);

        return { summary };
      }),

    // Generate reply suggestions
    generateReplies: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId);
        if (!email || email.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Check if replies already exist
        const existing = await db.getEmailReplies(input.emailId);
        if (existing.length > 0) {
          return { replies: existing.map((r) => r.replyText) };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an email assistant. Generate 3 different professional reply options for this email. Format as JSON array with 3 strings.",
            },
            {
              role: "user",
              content: `From: ${email.from}\nSubject: ${email.subject}\n\nContent: ${email.body || email.snippet}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "replies",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  replies: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["replies"],
                additionalProperties: false,
              },
            },
          },
        });

        let replies: string[] = [];
        try {
          const content =
            typeof response.choices[0]?.message.content === "string"
              ? response.choices[0].message.content
              : "{}";
          const parsed = JSON.parse(content);
          replies = parsed.replies || [];
        } catch {
          replies = [
            "Thank you for your email.",
            "I will review this and get back to you.",
            "Please let me know if you need any clarification.",
          ];
        }

        // Store replies
        for (let i = 0; i < replies.length; i++) {
          await db.createEmailReply(input.emailId, replies[i], i);
        }

        return { replies };
      }),

    // Score email priority
    scoreEmailPriority: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId);
        if (!email || email.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an email priority scorer. Rate the importance of this email on a scale of 0-100. Respond with ONLY a number.",
            },
            {
              role: "user",
              content: `From: ${email.from}\nSubject: ${email.subject}\n\nContent: ${email.snippet || email.body}`,
            },
          ],
        });

        const contentStr =
          typeof response.choices[0]?.message.content === "string"
            ? response.choices[0].message.content
            : "50";
        const score = parseInt(contentStr.trim() || "50", 10);
        const aiScore = Math.max(0, Math.min(100, score));

        await db.updateEmail(input.emailId, { aiScore });

        return { score: aiScore };
      }),
  }),

  // ========================================================================
  // AUTOMATION RULES ROUTES
  // ========================================================================
  rules: router({
    // Get all rules
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRulesByUserId(ctx.user.id);
    }),

    // Create rule
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          conditions: z.record(z.string(), z.any()),
          actions: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const rule = await db.createRule(
          ctx.user.id,
          input.name,
          input.description,
          input.conditions,
          input.actions
        );

        return rule;
      }),

    // Update rule
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
          conditions: z.record(z.string(), z.any()).optional(),
          actions: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const rules = await db.getRulesByUserId(ctx.user.id);
        if (!rules.find((r) => r.id === input.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const updateData: Record<string, any> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.conditions !== undefined) updateData.conditions = input.conditions;
        if (input.actions !== undefined) updateData.actions = input.actions;

        await db.updateRule(input.id, updateData);

        return { success: true };
      }),

    // Delete rule
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const rules = await db.getRulesByUserId(ctx.user.id);
        if (!rules.find((r) => r.id === input.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.deleteRule(input.id);

        return { success: true };
      }),
  }),

  // ========================================================================
  // ANALYTICS ROUTES
  // ========================================================================
  analytics: router({
    // Get analytics for user
    getAnalytics: protectedProcedure
      .input(z.object({ daysBack: z.number().default(30) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getAnalyticsForUser(ctx.user.id, input?.daysBack || 30);
      }),

    // Get email statistics
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const emails = await db.getEmailsByUserId(ctx.user.id, 1000);

      const totalEmails = emails.length;
      const readEmails = emails.filter((e) => e.isRead).length;
      const unreadEmails = totalEmails - readEmails;

      // Category distribution
      const categoryCounts: Record<string, number> = {};
      emails.forEach((e) => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      });

      // Top senders
      const senderCounts: Record<string, number> = {};
      emails.forEach((e) => {
        senderCounts[e.from] = (senderCounts[e.from] || 0) + 1;
      });
      const topSenders = Object.entries(senderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([email, count]) => ({ email, count }));

      return {
        totalEmails,
        readEmails,
        unreadEmails,
        categoryCounts,
        topSenders,
      };
    }),
  }),

  // ========================================================================
  // AI ASSISTANT ROUTES
  // ========================================================================
  assistant: aiAssistantRouter,

  // ========================================================================
  // SUBSCRIPTION ROUTES
  // ========================================================================
  subscription: router({
    // Get current subscription
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      return subscription || { tier: "free", status: "active" };
    }),

    // Upgrade subscription
    upgrade: protectedProcedure
      .input(z.object({ tier: z.enum(["pro", "enterprise"]) }))
      .mutation(async ({ ctx, input }) => {
        // In production, integrate with Stripe
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);

        if (subscription) {
          await db.updateSubscription(ctx.user.id, { tier: input.tier });
        } else {
          await db.createSubscription({
            userId: ctx.user.id,
            tier: input.tier,
            status: "active",
          });
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
