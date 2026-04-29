import { execSync } from "child_process";

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    body?: { data: string };
    parts?: Array<{ body?: { data: string } }>;
  };
  internalDate: string;
}

interface GmailThread {
  id: string;
  messages: GmailMessage[];
}

/**
 * Execute Gmail MCP tool and return parsed JSON result
 */
function executeGmailTool(toolName: string, input: any): any {
  try {
    const inputJson = JSON.stringify(input);
    const command = `manus-mcp-cli tool call ${toolName} --server gmail --input '${inputJson}'`;
    const result = execSync(command, { encoding: "utf-8" });

    // Parse the JSON result from the output
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return result;
  } catch (error) {
    console.error(`Gmail MCP error for ${toolName}:`, error);
    throw error;
  }
}

/**
 * Search for emails in Gmail
 */
export async function searchGmailMessages(query: string = "", maxResults: number = 50) {
  const result = executeGmailTool("gmail_search_messages", {
    q: query,
    max_results: Math.min(maxResults, 500),
  });

  return result;
}

/**
 * Read one or more Gmail threads
 */
export async function readGmailThreads(threadIds: string[]) {
  const result = executeGmailTool("gmail_read_threads", {
    thread_ids: threadIds.slice(0, 100), // Max 100 threads
    include_full_messages: true,
  });

  return result;
}

/**
 * Send Gmail messages
 */
export async function sendGmailMessage(
  to: string[],
  subject: string,
  content: string,
  options?: {
    cc?: string[];
    bcc?: string[];
    threadId?: string;
    isDraft?: boolean;
  }
) {
  const messages = [
    {
      to,
      cc: options?.cc || [],
      bcc: options?.bcc || [],
      subject,
      content,
      thread_id: options?.threadId,
    },
  ];

  const result = executeGmailTool("gmail_send_messages", {
    messages,
  });

  return result;
}

/**
 * Manage Gmail labels
 */
export async function manageGmailLabels(
  operation: "list" | "get" | "create" | "update" | "delete" | "apply" | "remove",
  options?: {
    labelId?: string;
    name?: string;
    messageIds?: string[];
    labelListVisibility?: string;
    messageListVisibility?: string;
  }
) {
  const input: any = { operation };

  if (options?.labelId) input.label_id = options.labelId;
  if (options?.name) input.name = options.name;
  if (options?.messageIds) input.message_ids = options.messageIds;
  if (options?.labelListVisibility) input.label_list_visibility = options.labelListVisibility;
  if (options?.messageListVisibility) input.message_list_visibility = options.messageListVisibility;

  const result = executeGmailTool("gmail_manage_labels", input);

  return result;
}

/**
 * Extract email body from Gmail message
 */
export function extractEmailBody(message: GmailMessage): string {
  if (!message.payload) return message.snippet || "";

  // Check for body in main payload
  if (message.payload.body?.data) {
    return Buffer.from(message.payload.body.data, "base64").toString("utf-8");
  }

  // Check for body in parts
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
  }

  return message.snippet || "";
}

/**
 * Extract email headers
 */
export function extractEmailHeaders(message: GmailMessage) {
  const headers: Record<string, string> = {};

  if (message.payload?.headers) {
    for (const header of message.payload.headers) {
      headers[header.name.toLowerCase()] = header.value;
    }
  }

  return {
    from: headers["from"] || "",
    to: headers["to"] || "",
    cc: headers["cc"] || "",
    bcc: headers["bcc"] || "",
    subject: headers["subject"] || "",
    date: headers["date"] || "",
  };
}

/**
 * Parse email address from header
 */
export function parseEmailAddress(emailString: string): { email: string; name: string } {
  const match = emailString.match(/^([^<]*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    };
  }
  return {
    name: "",
    email: emailString.trim(),
  };
}
