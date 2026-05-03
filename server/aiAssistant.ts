import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * AI Assistant Service for Azlor
 * Provides intelligent email management assistance with context awareness
 */

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantContext {
  userId: number;
  currentEmailId?: number;
  recentEmails?: any[];
  userPreferences?: Record<string, any>;
}

export class AzlorAIAssistant {
  private conversationHistory: AssistantMessage[] = [];
  private context: AssistantContext;

  constructor(context: AssistantContext) {
    this.context = context;
  }

  /**
   * Initialize assistant with system context
   */
  private getSystemPrompt(): string {
    return `You are Azlor AI Assistant, an intelligent email management helper. You help users:
1. Organize and prioritize their emails
2. Draft professional responses
3. Understand email content and importance
4. Set up automation rules
5. Manage their inbox efficiently

You have access to the user's email context and can provide personalized recommendations.
Be concise, professional, and helpful. Always prioritize the user's time and productivity.

Current context:
- User ID: ${this.context.userId}
${this.context.currentEmailId ? `- Current Email ID: ${this.context.currentEmailId}` : ""}
${this.context.recentEmails ? `- Recent emails count: ${this.context.recentEmails.length}` : ""}

Always provide actionable advice and be ready to help with:
- Email categorization suggestions
- Priority assessment
- Reply drafting
- Rule creation
- Workflow optimization`;
  }

  /**
   * Chat with AI assistant
   */
  async chat(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // Prepare messages for LLM
    const messages = [
      {
        role: "system" as const,
        content: this.getSystemPrompt(),
      },
      ...this.conversationHistory,
    ];

    try {
      const response = await invokeLLM({
        messages: messages as any,
      });

      const assistantMessage =
        typeof response.choices[0]?.message.content === "string"
          ? response.choices[0].message.content
          : "I'm having trouble understanding. Could you rephrase that?";

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (error) {
      console.error("[AI Assistant] Error:", error);
      throw error;
    }
  }

  /**
   * Get email-specific assistance
   */
  async getEmailAssistance(emailId: number): Promise<string> {
    const email = await db.getEmailById(emailId);
    if (!email) {
      throw new Error("Email not found");
    }

    const summary = await db.getEmailSummary(emailId);
    const replies = await db.getEmailReplies(emailId);

    const context = `
Email Details:
- From: ${email.from}
- Subject: ${email.subject}
- Category: ${email.category}
- Priority Score: ${email.aiScore}/100
- Read: ${email.isRead ? "Yes" : "No"}
- Starred: ${email.isStarred ? "Yes" : "No"}

${summary ? `Summary: ${summary.summary}` : ""}

${replies && replies.length > 0 ? `Suggested Replies:\n${replies.map((r, i) => `${i + 1}. ${r.replyText}`).join("\n")}` : ""}

What would you like help with regarding this email?`;

    return await this.chat(context);
  }

  /**
   * Get inbox optimization suggestions
   */
  async getInboxOptimization(userId: number): Promise<string> {
    const emails = await db.getEmailsByUserId(userId, 100);
    const rules = await db.getRulesByUserId(userId);

    const stats = {
      totalEmails: emails.length,
      unreadCount: emails.filter((e) => !e.isRead).length,
      categorized: emails.filter((e) => e.category).length,
      rulesCount: rules.length,
    };

    const suggestion = `
Based on your inbox analysis:
- Total emails: ${stats.totalEmails}
- Unread: ${stats.unreadCount}
- Categorized: ${stats.categorized}
- Active rules: ${stats.rulesCount}

What specific inbox management help do you need?`;

    return await this.chat(suggestion);
  }

  /**
   * Generate rule suggestions
   */
  async suggestRules(userId: number): Promise<Array<{ name: string; description: string; conditions: any; actions: any }>> {
    const emails = await db.getEmailsByUserId(userId, 50);

    // Analyze email patterns
    const senderCounts: Record<string, number> = {};
    const subjectPatterns: Record<string, number> = {};

    emails.forEach((email) => {
      senderCounts[email.from] = (senderCounts[email.from] || 0) + 1;
      const subjectKeywords = (email.subject || "").split(" ").slice(0, 3).join(" ");
      if (subjectKeywords) {
        subjectPatterns[subjectKeywords] = (subjectPatterns[subjectKeywords] || 0) + 1;
      }
    });

    // Find top senders and patterns
    const topSenders = Object.entries(senderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topPatterns = Object.entries(subjectPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const suggestions = [];

    // Suggest rules for top senders
    for (const [sender, count] of topSenders) {
      if (count >= 3) {
        suggestions.push({
          name: `Auto-label emails from ${sender.split("@")[0]}`,
          description: `Automatically label emails from ${sender}`,
          conditions: { from: sender },
          actions: { labels: [sender.split("@")[0]] },
        });
      }
    }

    // Suggest rules for patterns
    for (const [pattern, count] of topPatterns) {
      if (count >= 3) {
        suggestions.push({
          name: `Auto-label "${pattern}" emails`,
          description: `Automatically label emails with subject containing "${pattern}"`,
          conditions: { subject: pattern },
          actions: { labels: [pattern.toLowerCase().replace(/\s+/g, "-")] },
        });
      }
    }

    return suggestions;
  }

  /**
   * Draft professional reply
   */
  async draftReply(emailId: number, tone: string = "professional"): Promise<string> {
    const email = await db.getEmailById(emailId);
    if (!email) {
      throw new Error("Email not found");
    }

    const prompt = `Draft a ${tone} email reply to:

From: ${email.from}
Subject: ${email.subject}

Content:
${email.body || email.snippet}

Keep it concise and professional.`;

    return await this.chat(prompt);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): AssistantMessage[] {
    return this.conversationHistory;
  }
}

/**
 * Create AI Assistant instance for user
 */
export async function createAssistant(userId: number): Promise<AzlorAIAssistant> {
  const emails = await db.getEmailsByUserId(userId, 10);

  return new AzlorAIAssistant({
    userId,
    recentEmails: emails,
  });
}
