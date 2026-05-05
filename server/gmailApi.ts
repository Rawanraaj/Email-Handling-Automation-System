import { gmail_v1, google } from "googleapis";
import { encrypt, decrypt } from "./encryption";
import { OAuth2Client } from "google-auth-library";
import { getDb } from "./db";
import { gmailTokens, emails, emailSummaries, emailReplies } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Real Gmail API Integration Service
 * Handles OAuth 2.0 token management, email fetching, sending, and label management
 */

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

export class GmailApiService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(clientId: string, clientSecret: string, redirectUrl: string) {
    this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);
    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  /**
   * Get authorization URL for user to grant permissions
   */
  getAuthorizationUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: GMAIL_SCOPES,
      prompt: "consent",
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Store Gmail tokens in database (encrypted)
   */
  async storeGmailTokens(
    userId: number,
    tokens: any,
    scope: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Encrypt tokens using AES-256-GCM before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : null;

    await db
      .insert(gmailTokens)
      .values({
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
        scope,
      })
      .onConflictDoUpdate({
        target: gmailTokens.userId,
        set: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get Gmail tokens for user
   */
  async getGmailTokens(userId: number): Promise<any | null> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(gmailTokens)
      .where(eq(gmailTokens.userId, userId))
      .limit(1);

    if (!result.length) return null;

    const token = result[0];
    // Decrypt tokens
    const accessToken = decrypt(token.accessToken);
    const refreshToken = token.refreshToken
      ? decrypt(token.refreshToken)
      : null;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: token.expiresAt?.getTime(),
    };
  }

  /**
   * Set credentials for API calls
   */
  async setUserCredentials(userId: number): Promise<void> {
    const tokens = await this.getGmailTokens(userId);
    if (!tokens) throw new Error("No Gmail tokens found for user");

    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Fetch emails from Gmail
   */
  async fetchEmails(
    userId: number,
    query: string = "",
    maxResults: number = 50
  ): Promise<any[]> {
    await this.setUserCredentials(userId);

    const response = await this.gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = response.data.messages || [];
    const emailDetails: any[] = [];

    for (const message of messages) {
      if (!message.id) continue;

      const detail = await this.gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name === name)?.value || "";

      const emailData = {
        gmailId: message.id,
        threadId: message.threadId,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        snippet: detail.data.snippet || "",
        body: this.extractBody(detail.data.payload),
        receivedAt: new Date(
          parseInt(detail.data.internalDate || "0")
        ),
      };

      emailDetails.push(emailData);
    }

    return emailDetails;
  }

  /**
   * Extract email body from payload
   */
  private extractBody(payload: any): string {
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return Buffer.from(part.body.data, "base64").toString();
        }
      }
    }

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString();
    }

    return "";
  }

  /**
   * Send email
   */
  async sendEmail(
    userId: number,
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string
  ): Promise<string> {
    await this.setUserCredentials(userId);

    const message = this.createMessage(to, subject, body, cc, bcc);
    const response = await this.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: message,
      },
    });

    return response.data.id || "";
  }

  /**
   * Create RFC 2822 formatted message
   */
  private createMessage(
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string
  ): string {
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      cc && `Cc: ${cc}`,
      bcc && `Bcc: ${bcc}`,
    ]
      .filter(Boolean)
      .join("\r\n");

    const message = `${headers}\r\n\r\n${body}`;
    return Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  }

  /**
   * Apply label to email
   */
  async applyLabel(
    userId: number,
    messageId: string,
    labelName: string
  ): Promise<void> {
    await this.setUserCredentials(userId);

    // Get or create label
    const labels = await this.gmail.users.labels.list({ userId: "me" });
    let labelId = labels.data.labels?.find((l) => l.name === labelName)?.id;

    if (!labelId) {
      const newLabel = await this.gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      labelId = newLabel.data.id;
    }

    if (labelId) {
      await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });
    }
  }

  /**
   * Archive email (add Archive label)
   */
  async archiveEmail(userId: number, messageId: string): Promise<void> {
    await this.setUserCredentials(userId);

    await this.gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });
  }

  /**
   * Star email
   */
  async starEmail(userId: number, messageId: string): Promise<void> {
    await this.setUserCredentials(userId);

    await this.gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: ["STARRED"],
      },
    });
  }

  /**
   * Mark email as read
   */
  async markAsRead(userId: number, messageId: string): Promise<void> {
    await this.setUserCredentials(userId);

    await this.gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
  }

  /**
   * Get email thread
   */
  async getThread(userId: number, threadId: string): Promise<any> {
    await this.setUserCredentials(userId);

    const response = await this.gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "full",
    });

    return response.data;
  }
}

// Initialize Gmail API Service
let gmailService: GmailApiService | null = null;

export function initGmailService(
  clientId: string,
  clientSecret: string,
  redirectUrl: string
): GmailApiService {
  if (!gmailService) {
    gmailService = new GmailApiService(clientId, clientSecret, redirectUrl);
  }
  return gmailService;
}

export function getGmailService(): GmailApiService {
  if (!gmailService) {
    throw new Error("Gmail service not initialized");
  }
  return gmailService;
}
