import * as gmail from "./gmail";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Sync Gmail emails for a user
 * Fetches recent emails from Gmail and stores them in the database
 */
export async function syncGmailEmails(userId: number, maxResults: number = 50) {
  try {
    // Search for recent emails
    const searchResult = await gmail.searchGmailMessages("", maxResults);

    if (!searchResult.messages || searchResult.messages.length === 0) {
      console.log(`[EmailSync] No emails found for user ${userId}`);
      return { synced: 0, errors: 0 };
    }

    // Get thread IDs
    const threadIds = searchResult.messages.map((msg: any) => msg.threadId);

    // Read full threads
    const threadsResult = await gmail.readGmailThreads(threadIds);

    if (!threadsResult.threads) {
      console.log(`[EmailSync] No threads found for user ${userId}`);
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Process each thread
    for (const thread of threadsResult.threads) {
      try {
        // Get the latest message in the thread
        const latestMessage = thread.messages?.[thread.messages.length - 1];

        if (!latestMessage) continue;

        const headers = gmail.extractEmailHeaders(latestMessage);
        const body = gmail.extractEmailBody(latestMessage);
        const { email: fromEmail, name: fromName } = gmail.parseEmailAddress(headers.from);

        // Check if email already exists
        const existingEmail = await db.getEmailById(parseInt(latestMessage.id), userId);
        if (existingEmail) {
          console.log(`[EmailSync] Email ${latestMessage.id} already synced`);
          continue;
        }

        // Categorize email using AI
        const categoryResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an email categorization expert. Categorize the email into one of these categories: Work, Personal, Promotions, Urgent, or Other. Respond with ONLY the category name.",
            },
            {
              role: "user",
              content: `Subject: ${headers.subject}\n\nFrom: ${headers.from}\n\nContent: ${body.substring(0, 500)}`,
            },
          ],
        });

        const categoryStr = typeof categoryResponse.choices[0]?.message.content === 'string' 
          ? categoryResponse.choices[0].message.content 
          : '';
        const category = categoryStr.trim() || "Other";

        // Score email priority
        const scoreResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an email priority scorer. Rate the importance of this email on a scale of 0-100. Respond with ONLY a number.",
            },
            {
              role: "user",
              content: `Subject: ${headers.subject}\n\nFrom: ${headers.from}`,
            },
          ],
        });

        const scoreStr = typeof scoreResponse.choices[0]?.message.content === 'string' 
          ? scoreResponse.choices[0].message.content 
          : '';
        const aiScore = Math.max(0, Math.min(100, parseInt(scoreStr.trim() || "50", 10)));

        // Store email in database
        await db.upsertEmail({
          userId,
          gmailId: latestMessage.id,
          threadId: thread.id,
          from: fromEmail,
          senderName: fromName,
          to: headers.to,
          cc: headers.cc,
          bcc: headers.bcc,
          subject: headers.subject,
          snippet: latestMessage.snippet,
          body,
          isRead: latestMessage.labelIds?.includes("UNREAD") ? 0 : 1,
          isStarred: latestMessage.labelIds?.includes("STARRED") ? 1 : 0,
          category: category as any,
          aiScore,
          hasSummary: 0,
          hasReplySuggestions: 0,
          receivedAt: new Date(parseInt(latestMessage.internalDate)),
        });

        synced++;
        console.log(`[EmailSync] Synced email: ${headers.subject}`);
      } catch (error) {
        console.error(`[EmailSync] Error processing thread:`, error);
        errors++;
      }
    }

    console.log(`[EmailSync] Sync complete for user ${userId}: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error(`[EmailSync] Fatal error:`, error);
    throw error;
  }
}

/**
 * Apply automation rules to an email
 */
export async function applyAutomationRules(userId: number, emailId: number) {
  try {
    const email = await db.getEmailById(emailId, userId);
    if (!email) return;

    const rules = await db.getRulesByUserId(userId);

    for (const rule of rules) {
      const condition = JSON.parse(rule.condition);
      const action = JSON.parse(rule.action);

      let matches = false;

      // Check if rule condition matches
      if (condition.type === "from" && email.from.includes(condition.value)) {
        matches = true;
      } else if (condition.type === "subject" && email.subject?.includes(condition.value)) {
        matches = true;
      } else if (condition.type === "to" && email.to.includes(condition.value)) {
        matches = true;
      }

      if (matches) {
        // Apply action
        if (action.type === "label") {
          await db.updateEmailCategory(emailId, action.value);
        } else if (action.type === "star") {
          await db.updateEmailStarred(emailId, true);
        } else if (action.type === "archive") {
          // TODO: Implement archive via Gmail MCP
        }

        console.log(`[AutomationRules] Applied rule "${rule.name}" to email ${emailId}`);
      }
    }
  } catch (error) {
    console.error(`[AutomationRules] Error applying rules:`, error);
  }
}

/**
 * Generate daily analytics snapshot
 */
export async function generateDailyAnalytics(userId: number) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get email counts by category
    const workEmails = await db.getEmailsByCategory(userId, "Work", 1000);
    const personalEmails = await db.getEmailsByCategory(userId, "Personal", 1000);
    const promotionsEmails = await db.getEmailsByCategory(userId, "Promotions", 1000);
    const urgentEmails = await db.getEmailsByCategory(userId, "Urgent", 1000);

    const allEmails = await db.getEmailsByUserId(userId, 1000, 0);

    await db.saveAnalyticsSnapshot(userId, today, {
      emailCount: allEmails.length,
      workCount: workEmails.length,
      personalCount: personalEmails.length,
      promotionsCount: promotionsEmails.length,
      urgentCount: urgentEmails.length,
      averageResponseTime: 0, // TODO: Calculate from email timestamps
    });

    console.log(`[Analytics] Generated daily snapshot for user ${userId}`);
  } catch (error) {
    console.error(`[Analytics] Error generating snapshot:`, error);
  }
}
