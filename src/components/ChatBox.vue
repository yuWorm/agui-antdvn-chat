<script setup lang="ts">
import { computed } from "vue";
import ChatInput from "./ChatInput.vue";
import MessageList from "./MessageList.vue";
import type {
  Attachment,
  ChatError,
  Message,
  SendPayload,
  StreamingStatus,
  ToolCallRecord,
} from "@/types";

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
    streamingContent: "",
    streamingReasoning: "",
    streamingStatus: "idle",
    pendingToolCalls: () => [],
    disabled: false,
    loading: false,
    placeholder: "Type a message...",
    acceptFileTypes: "image/*,.pdf,.txt,.csv,.md,.json,.doc,.docx,.xls,.xlsx",
  },
);

const emit = defineEmits<{
  send: [payload: SendPayload];
  stop: [];
  confirmTool: [toolCallId: string];
  rejectTool: [toolCallId: string];
}>();

const isStreaming = computed(() => props.streamingStatus === "streaming");

const pendingConfirmations = computed(() =>
  props.pendingToolCalls.filter((t) => t.status === "awaiting_confirmation"),
);

const executingToolCalls = computed(() =>
  props.pendingToolCalls.filter(
    (t) =>
      t.status === "executing" ||
      t.status === "completed" ||
      t.status === "error",
  ),
);

const slots = defineSlots<{
  header?: () => unknown;
  welcome?: () => unknown;
  loading?: () => unknown;
  "message-user"?: (props: { message: Message }) => unknown;
  "message-assistant"?: (props: {
    message: Message;
    streaming: boolean;
  }) => unknown;
  "message-actions"?: (props: { message: Message }) => unknown;
  "assistant-avatar"?: () => unknown;
  "tool-confirm"?: (props: {
    toolCall: ToolCallRecord;
    confirm: (id: string) => void;
    reject: (id: string) => void;
  }) => unknown;
  "tool-card"?: (props: { toolCall: ToolCallRecord }) => unknown;
  "input-actions"?: () => unknown;
  "input-footer"?: () => unknown;
}>();
</script>

<template>
  <div class="chat-box">
    <!-- Header slot -->
    <div v-if="slots.header" class="chat-box-header">
      <slot name="header" />
    </div>

    <!-- Loading state -->
    <template v-if="loading">
      <div class="loading-state">
        <slot name="loading">
          <div class="loading-spinner">
            <span /><span /><span />
          </div>
        </slot>
      </div>
    </template>

    <!-- Empty / welcome state -->
    <template v-else-if="messages.length === 0">
      <div class="welcome-state">
        <slot name="welcome">
          <div class="welcome-content">
            <h1 class="welcome-title">AI Assistant</h1>
            <p class="welcome-subtitle">What can I help you with?</p>
          </div>
        </slot>
      </div>
      <ChatInput
        :disabled="disabled"
        :placeholder="placeholder"
        :upload-handler="uploadHandler"
        :accept-file-types="acceptFileTypes"
        :max-files="maxFiles"
        :max-file-size="maxFileSize"
        :on-error="onError"
        :on-before-send="onBeforeSend"
        @send="(p) => emit('send', p)"
        @stop="emit('stop')"
      >
        <template #input-actions>
          <slot name="input-actions" />
        </template>
        <template #input-footer>
          <slot name="input-footer" />
        </template>
      </ChatInput>
    </template>

    <!-- Chat conversation -->
    <template v-else>
      <MessageList
        :messages="messages"
        :streaming-content="streamingContent"
        :streaming-reasoning="streamingReasoning"
        :is-streaming="isStreaming"
        :pending-confirmations="pendingConfirmations"
        :executing-tool-calls="executingToolCalls"
        @confirm-tool="(id: string) => emit('confirmTool', id)"
        @reject-tool="(id: string) => emit('rejectTool', id)"
      >
        <template v-if="slots['message-user']" #message-user="scope">
          <slot name="message-user" v-bind="scope" />
        </template>
        <template v-if="slots['message-assistant']" #message-assistant="scope">
          <slot name="message-assistant" v-bind="scope" />
        </template>
        <template v-if="slots['message-actions']" #message-actions="scope">
          <slot name="message-actions" v-bind="scope" />
        </template>
        <template v-if="slots['assistant-avatar']" #assistant-avatar>
          <slot name="assistant-avatar" />
        </template>
        <template v-if="slots['tool-confirm']" #tool-confirm="scope">
          <slot name="tool-confirm" v-bind="scope" />
        </template>
        <template v-if="slots['tool-card']" #tool-card="scope">
          <slot name="tool-card" v-bind="scope" />
        </template>
      </MessageList>
      <ChatInput
        :disabled="disabled"
        :placeholder="placeholder"
        :upload-handler="uploadHandler"
        :accept-file-types="acceptFileTypes"
        :max-files="maxFiles"
        :max-file-size="maxFileSize"
        :on-error="onError"
        :on-before-send="onBeforeSend"
        @send="(p) => emit('send', p)"
        @stop="emit('stop')"
      >
        <template #input-actions>
          <slot name="input-actions" />
        </template>
        <template #input-footer>
          <slot name="input-footer" />
        </template>
      </ChatInput>
    </template>
  </div>
</template>

<style scoped>
.chat-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
}

.chat-box-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}

.welcome-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
  max-width: 480px;
  padding: 0 24px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.6;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: flex;
  gap: 6px;
}

.loading-spinner span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

.loading-spinner span:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-spinner span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
