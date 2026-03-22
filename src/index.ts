// Components
export { default as ChatBox } from "./components/ChatBox.vue";
export { default as ChatClient } from "./components/ChatClient.vue";
export { default as ChatInput } from "./components/ChatInput.vue";
export { default as MessageList } from "./components/MessageList.vue";
export { default as AssistantMessage } from "./components/AssistantMessage.vue";
export { default as UserMessage } from "./components/UserMessage.vue";
export { default as MarkdownViewer } from "./components/MarkdownViewer.vue";
export { default as ThinkingBlock } from "./components/ThinkingBlock.vue";
export { default as ToolCallCard } from "./components/ToolCallCard.vue";
export { default as HilConfirm } from "./components/HilConfirm.vue";
export { default as AttachmentPreview } from "./components/AttachmentPreview.vue";

// Composables
export { useChat } from "./composables/useChat";
export type { UseChatReturn } from "./composables/useChat";

// Types
export type {
  Message,
  Attachment,
  ToolCallRecord,
  StreamingStatus,
  PendingFile,
  ChatBoxProps,
  ChatBoxEmits,
  ChatError,
  RequestConfig,
  SendPayload,
  UseChatOptions,
  ChatClientProps,
} from "./types";
