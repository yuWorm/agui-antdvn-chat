<script setup lang="ts">
import { useChat } from "../composables/useChat";
import ChatBox from "./ChatBox.vue";
import type {
  Attachment,
  ChatError,
  Message,
  RequestConfig,
  SendPayload,
  ToolCallRecord,
} from "../types";

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
    placeholder: "Type a message...",
    acceptFileTypes: "image/*,.pdf,.txt,.csv,.md,.json,.doc,.docx,.xls,.xlsx",
    disabled: false,
    loading: false,
  },
);

const chat = useChat({
  agentUrl: props.agentUrl,
  uploadUrl: props.uploadUrl,
  toolExecuteUrl: props.toolExecuteUrl,
  threadId: props.threadId,
  initialMessages: props.initialMessages,
  getHeaders: props.getHeaders,
  requestInterceptor: props.requestInterceptor,
  onError: props.onError,
  onBeforeSend: props.onBeforeSend,
  onStreamStart: props.onStreamStart,
  onStreamEnd: props.onStreamEnd,
  onToolCall: props.onToolCall,
});

async function handleUpload(file: File): Promise<Attachment> {
  return await chat.uploadFile(file);
}

defineExpose({
  /** Direct access to the useChat composable return value */
  chat,
});
</script>

<template>
  <ChatBox
    :messages="(chat.messages.value as Message[])"
    :streaming-content="chat.streamingContent.value"
    :streaming-reasoning="chat.streamingReasoning.value"
    :streaming-status="chat.streamingStatus.value"
    :pending-tool-calls="(chat.pendingToolCalls.value as ToolCallRecord[])"
    :disabled="disabled || chat.isBusy.value"
    :loading="loading"
    :placeholder="placeholder"
    :upload-handler="uploadUrl ? handleUpload : undefined"
    :accept-file-types="acceptFileTypes"
    :max-files="maxFiles"
    :max-file-size="maxFileSize"
    :on-error="onError"
    :on-before-send="onBeforeSend"
    @send="chat.send"
    @stop="chat.stop"
    @confirm-tool="(id: string) => chat.resolveConfirmation(id, true)"
    @reject-tool="(id: string) => chat.resolveConfirmation(id, false)"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <template v-if="$slots.welcome" #welcome>
      <slot name="welcome" />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots['message-user']" #message-user="scope">
      <slot name="message-user" v-bind="scope" />
    </template>
    <template v-if="$slots['message-assistant']" #message-assistant="scope">
      <slot name="message-assistant" v-bind="scope" />
    </template>
    <template v-if="$slots['message-actions']" #message-actions="scope">
      <slot name="message-actions" v-bind="scope" />
    </template>
    <template v-if="$slots['assistant-avatar']" #assistant-avatar>
      <slot name="assistant-avatar" />
    </template>
    <template v-if="$slots['tool-confirm']" #tool-confirm="scope">
      <slot name="tool-confirm" v-bind="scope" />
    </template>
    <template v-if="$slots['tool-card']" #tool-card="scope">
      <slot name="tool-card" v-bind="scope" />
    </template>
    <template v-if="$slots['input-actions']" #input-actions>
      <slot name="input-actions" />
    </template>
    <template v-if="$slots['input-footer']" #input-footer>
      <slot name="input-footer" />
    </template>
  </ChatBox>
</template>
