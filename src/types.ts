export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
}

export interface Message {
  id: string;
  session_id?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning?: string | null;
  tool_calls?: ToolCallRecord[] | null;
  attachments?: Attachment[] | null;
  metadata_?: Record<string, unknown> | null;
  ordering?: number;
  created_at?: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status:
    | "pending"
    | "awaiting_confirmation"
    | "confirmed"
    | "rejected"
    | "executing"
    | "completed"
    | "error";
}

export type StreamingStatus =
  | "idle"
  | "streaming"
  | "confirming"
  | "executing"
  | "error";

export interface PendingFile {
  file: File;
  previewUrl?: string;
}

// ---------------------------------------------------------------------------
// Error & Request types
// ---------------------------------------------------------------------------

export interface ChatError {
  type: "send" | "upload" | "tool_execute" | "stream" | "network";
  message: string;
  originalError?: unknown;
}

export interface RequestConfig {
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export type SendPayload = { content: string; attachments: Attachment[] };

// ---------------------------------------------------------------------------
// ChatBox props / emits
// ---------------------------------------------------------------------------

export interface ChatBoxProps {
  messages: Message[];
  streamingContent?: string;
  streamingReasoning?: string;
  streamingStatus?: StreamingStatus;
  pendingToolCalls?: ToolCallRecord[];
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  uploadHandler?: (file: File) => Promise<Attachment>;
  acceptFileTypes?: string;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (error: ChatError) => void;
  onBeforeSend?: (
    payload: SendPayload,
  ) => SendPayload | false | Promise<SendPayload | false>;
}

export interface ChatBoxEmits {
  send: [payload: SendPayload];
  stop: [];
  confirmTool: [toolCallId: string];
  rejectTool: [toolCallId: string];
}

// ---------------------------------------------------------------------------
// useChat composable options
// ---------------------------------------------------------------------------

export interface UseChatOptions {
  agentUrl: string;
  uploadUrl?: string;
  toolExecuteUrl?: string;
  threadId?: string;
  initialMessages?: Message[];

  getHeaders?:
    | (() => Record<string, string>)
    | (() => Promise<Record<string, string>>);
  requestInterceptor?: (
    config: RequestConfig,
  ) => RequestConfig | Promise<RequestConfig>;

  onError?: (error: ChatError) => void;
  onBeforeSend?: (
    payload: SendPayload,
  ) => SendPayload | false | Promise<SendPayload | false>;
  onStreamStart?: () => void;
  onStreamEnd?: (message: Message) => void;
  onToolCall?: (toolCall: ToolCallRecord) => void;
}

// ---------------------------------------------------------------------------
// ChatClient props (union of ChatBox visual props + UseChatOptions)
// ---------------------------------------------------------------------------

export interface ChatClientProps {
  agentUrl: string;
  uploadUrl?: string;
  toolExecuteUrl?: string;
  threadId?: string;
  initialMessages?: Message[];

  getHeaders?:
    | (() => Record<string, string>)
    | (() => Promise<Record<string, string>>);
  requestInterceptor?: (
    config: RequestConfig,
  ) => RequestConfig | Promise<RequestConfig>;

  onError?: (error: ChatError) => void;
  onBeforeSend?: (
    payload: SendPayload,
  ) => SendPayload | false | Promise<SendPayload | false>;
  onStreamStart?: () => void;
  onStreamEnd?: (message: Message) => void;
  onToolCall?: (toolCall: ToolCallRecord) => void;

  placeholder?: string;
  acceptFileTypes?: string;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  loading?: boolean;
}
