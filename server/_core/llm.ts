import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";
export type TextContent = { type: "text"; text: string };
export type MessageContent = string | TextContent;
export type Message = { role: Role; content: MessageContent | MessageContent[] };
export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  max_tokens?: number;
  system?: string;
  response_format?: any;
};
export type InvokeResult = {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

const assertApiKey = () => {
  if (!ENV.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
};

const getTextContent = (content: MessageContent | MessageContent[]): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.map((c) => (typeof c === "string" ? c : c.text)).join("\n");
  return (content as TextContent).text;
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  const { messages, maxTokens, max_tokens, system } = params;
  const maxTok = maxTokens || max_tokens || 1024;

  const systemMsg = messages.find((m) => m.role === "system");
  const systemPrompt = system || (systemMsg ? getTextContent(systemMsg.content) : undefined);
  const userMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: getTextContent(m.content) }));

  const payload: Record<string, unknown> = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: maxTok,
    messages: userMessages,
  };
  if (systemPrompt) payload.system = systemPrompt;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API failed: ${response.status} – ${errorText}`);
  }

  const data = (await response.json()) as {
    id: string;
    model: string;
    content: Array<{ type: string; text: string }>;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const textContent = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");

  return {
    id: data.id,
    model: data.model,
    choices: [{ index: 0, message: { role: "assistant", content: textContent }, finish_reason: data.stop_reason }],
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}
