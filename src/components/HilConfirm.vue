<script setup lang="ts">
import type { ToolCallRecord } from "@/types";

const props = defineProps<{ toolCall: ToolCallRecord }>();
const emit = defineEmits<{
  confirm: [id: string];
  reject: [id: string];
}>();
</script>

<template>
  <div class="hil-confirm">
    <div class="hil-header">
      <span class="hil-tag">Confirmation Required</span>
      <strong>{{ props.toolCall.name }}</strong>
    </div>
    <div class="hil-body">
      <p>The agent wants to execute this tool. Do you approve?</p>
      <code>{{ JSON.stringify(props.toolCall.arguments, null, 2) }}</code>
    </div>
    <div class="hil-actions">
      <button class="hil-btn hil-btn--approve" @click="emit('confirm', props.toolCall.id)">
        Approve
      </button>
      <button class="hil-btn hil-btn--reject" @click="emit('reject', props.toolCall.id)">
        Reject
      </button>
    </div>
  </div>
</template>

<style scoped>
.hil-confirm {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.hil-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.hil-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-warning-border);
  color: #874d00;
}

.hil-body {
  margin-bottom: 12px;
}

.hil-body p {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.hil-body code {
  display: block;
  background: var(--color-bg-code);
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text-secondary);
}

.hil-actions {
  display: flex;
  gap: 8px;
}

.hil-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hil-btn--approve {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.hil-btn--approve:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.hil-btn--reject {
  background: transparent;
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.hil-btn--reject:hover {
  background: var(--color-danger-bg);
}
</style>
