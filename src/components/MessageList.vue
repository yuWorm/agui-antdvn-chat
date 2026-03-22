<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import AssistantMessage from "./AssistantMessage.vue";
import HilConfirm from "./HilConfirm.vue";
import ThinkingBlock from "./ThinkingBlock.vue";
import ToolCallCard from "./ToolCallCard.vue";
import UserMessage from "./UserMessage.vue";
import type { Message, ToolCallRecord } from "@/types";

const props = defineProps<{
  messages: Message[];
  streamingContent: string;
  streamingReasoning: string;
  isStreaming: boolean;
  pendingConfirmations: ToolCallRecord[];
  executingToolCalls: ToolCallRecord[];
}>();

const emit = defineEmits<{
  confirmTool: [id: string];
  rejectTool: [id: string];
}>();

const slots = defineSlots<{
  "message-user"?: (props: { message: Message }) => unknown;
  "message-assistant"?: (props: { message: Message; streaming: boolean }) => unknown;
  "message-actions"?: (props: { message: Message }) => unknown;
  "assistant-avatar"?: () => unknown;
  "tool-confirm"?: (props: {
    toolCall: ToolCallRecord;
    confirm: (id: string) => void;
    reject: (id: string) => void;
  }) => unknown;
  "tool-card"?: (props: { toolCall: ToolCallRecord }) => unknown;
}>();

const listRef = ref<HTMLDivElement>();

watch(
  () => [props.messages.length, props.streamingContent, props.streamingReasoning, props.executingToolCalls.length],
  () => nextTick(() => listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: "smooth" })),
);

function handleConfirm(id: string) {
  emit("confirmTool", id);
}
function handleReject(id: string) {
  emit("rejectTool", id);
}
</script>

<template>
  <div ref="listRef" class="message-list">
    <div class="message-list-inner">
      <!-- History messages -->
      <template v-for="msg in messages" :key="msg.id">
        <!-- User message -->
        <template v-if="msg.role === 'user'">
          <slot name="message-user" :message="msg">
            <UserMessage :content="msg.content" :attachments="msg.attachments" />
          </slot>
          <slot name="message-actions" :message="msg" />
        </template>

        <!-- Assistant message -->
        <template v-else-if="msg.role === 'assistant'">
          <slot name="message-assistant" :message="msg" :streaming="false">
            <AssistantMessage
              :content="msg.content"
              :reasoning="msg.reasoning"
              :tool-calls="msg.tool_calls"
            >
              <template v-if="slots['assistant-avatar']" #avatar>
                <slot name="assistant-avatar" />
              </template>
              <template v-if="slots['tool-card']" #tool-card="tcScope">
                <slot name="tool-card" :tool-call="tcScope.toolCall" />
              </template>
            </AssistantMessage>
          </slot>
          <slot name="message-actions" :message="msg" />
        </template>
      </template>

      <!-- Tool confirmations -->
      <template v-for="tc in pendingConfirmations" :key="tc.id">
        <slot
          name="tool-confirm"
          :tool-call="tc"
          :confirm="handleConfirm"
          :reject="handleReject"
        >
          <HilConfirm
            :tool-call="tc"
            @confirm="handleConfirm(tc.id)"
            @reject="handleReject(tc.id)"
          />
        </slot>
      </template>

      <!-- Executing tool calls -->
      <div v-if="executingToolCalls.length" class="executing-tools">
        <template v-for="tc in executingToolCalls" :key="tc.id">
          <slot name="tool-card" :tool-call="tc">
            <ToolCallCard :tool-call="tc" />
          </slot>
        </template>
      </div>

      <!-- Streaming state -->
      <template v-if="isStreaming">
        <div v-if="!streamingContent && !streamingReasoning" class="thinking">
          <div class="thinking-dots">
            <span /><span /><span />
          </div>
          <span class="thinking-text">Thinking...</span>
        </div>
        <div v-else class="assistant-message">
          <div class="assistant-avatar">
            <slot name="assistant-avatar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </slot>
          </div>
          <div class="assistant-content">
            <ThinkingBlock v-if="streamingReasoning" :content="streamingReasoning" :streaming="true" />
            <AssistantMessage v-if="streamingContent" :content="streamingContent" :streaming="true" :inline="true" />
            <span v-if="!streamingContent" class="cursor-blink" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
}

.message-list-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px;
}

.executing-tools {
  padding: 8px 0 16px;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  color: var(--color-text-muted);
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-thinking-dot);
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.thinking-text {
  font-size: 14px;
}

.assistant-message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.assistant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-bg-avatar);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.assistant-content {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--color-primary);
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
