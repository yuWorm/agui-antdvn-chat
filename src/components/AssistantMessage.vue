<script setup lang="ts">
import MarkdownViewer from "./MarkdownViewer.vue";
import ThinkingBlock from "./ThinkingBlock.vue";
import ToolCallCard from "./ToolCallCard.vue";
import type { ToolCallRecord } from "@/types";

defineProps<{
  content: string;
  reasoning?: string | null;
  streaming?: boolean;
  inline?: boolean;
  toolCalls?: ToolCallRecord[] | null;
}>();

const slots = defineSlots<{
  avatar?: () => unknown;
  "tool-card"?: (props: { toolCall: ToolCallRecord }) => unknown;
}>();
</script>

<template>
  <template v-if="inline">
    <template v-for="tc in toolCalls" :key="tc.id">
      <slot name="tool-card" :tool-call="tc">
        <ToolCallCard :tool-call="tc" />
      </slot>
    </template>
    <MarkdownViewer :content="content" :streaming="streaming" />
    <span v-if="streaming" class="cursor-blink" />
  </template>
  <div v-else class="assistant-message">
    <div class="assistant-avatar">
      <slot name="avatar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </slot>
    </div>
    <div class="assistant-content">
      <ThinkingBlock v-if="reasoning" :content="reasoning" />
      <template v-for="tc in toolCalls" :key="tc.id">
        <slot name="tool-card" :tool-call="tc">
          <ToolCallCard :tool-call="tc" />
        </slot>
      </template>
      <MarkdownViewer :content="content" :streaming="streaming" />
      <span v-if="streaming" class="cursor-blink" />
    </div>
  </div>
</template>

<style scoped>
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
