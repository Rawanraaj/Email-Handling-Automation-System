import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { createAssistant } from "./aiAssistant";

/**
 * AI Assistant Routes for Azlor
 */

export const aiAssistantRouter = router({
  // Chat with AI assistant
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        conversationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const assistant = await createAssistant(ctx.user.id);
        const response = await assistant.chat(input.message);

        return {
          response,
          conversationId: input.conversationId || `conv_${Date.now()}`,
        };
      } catch (error) {
        console.error("[AI Assistant] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get assistant response",
        });
      }
    }),

  // Get email-specific assistance
  getEmailHelp: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const assistant = await createAssistant(ctx.user.id);
        const response = await assistant.getEmailAssistance(input.emailId);

        return { response };
      } catch (error) {
        console.error("[AI Assistant] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get email assistance",
        });
      }
    }),

  // Get inbox optimization suggestions
  getInboxSuggestions: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const assistant = await createAssistant(ctx.user.id);
      const suggestions = await assistant.getInboxOptimization(ctx.user.id);

      return { suggestions };
    } catch (error) {
      console.error("[AI Assistant] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get inbox suggestions",
      });
    }
  }),

  // Get rule suggestions based on email patterns
  suggestRules: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const assistant = await createAssistant(ctx.user.id);
      const rules = await assistant.suggestRules(ctx.user.id);

      return { rules };
    } catch (error) {
      console.error("[AI Assistant] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to suggest rules",
      });
    }
  }),

  // Draft professional reply
  draftReply: protectedProcedure
    .input(
      z.object({
        emailId: z.number(),
        tone: z
          .enum(["professional", "casual", "formal", "friendly"])
          .default("professional"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const assistant = await createAssistant(ctx.user.id);
        const draft = await assistant.draftReply(input.emailId, input.tone);

        return { draft };
      } catch (error) {
        console.error("[AI Assistant] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to draft reply",
        });
      }
    }),
});
