# 快速开始

## 安装

```bash
npm install @yuworm/agui-antdvn-chat
# or
pnpm add @yuworm/agui-antdvn-chat
# or
yarn add @yuworm/agui-antdvn-chat
```

### Peer Dependencies

| 依赖 | 版本 | 必需 | 说明 |
|------|------|------|------|
| `vue` | `^3.3.0` | 是 | Vue 3 核心 |
| `markstream-vue` | `^0.0.10-beta.1` | 是 | Markdown 流式渲染 |
| `@ag-ui/client` | `^0.0.47` | 否 | 仅 `useChat` / `ChatClient` 需要 |
| `@ag-ui/core` | `^0.0.47` | 否 | 仅 `useChat` / `ChatClient` 需要 |

使用 `ChatClient` 或 `useChat` 时需要安装 AG-UI 包：

```bash
npm install @ag-ui/client @ag-ui/core
```

## 引入样式

组件样式和主题变量需要在入口文件中显式引入：

```ts
// main.ts

// 组件样式（必须）
import "@yuworm/agui-antdvn-chat/dist/index.css";

// 默认主题变量（可选，如果宿主应用已提供同名 CSS 变量则不需要）
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";
```

## 方式一：ChatClient（推荐）

`ChatClient` 是一体化组件，内置状态管理和 AG-UI 流式通信。只需配置接口地址和认证信息即可使用：

```vue
<script setup lang="ts">
import { ChatClient } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";
import type { ChatError } from "@yuworm/agui-antdvn-chat";

function getHeaders() {
  const token = localStorage.getItem("access_token") || "";
  return { Authorization: `Bearer ${token}` };
}

function handleError(error: ChatError) {
  console.error(`${error.type}: ${error.message}`);
}
</script>

<template>
  <div style="height: 100vh">
    <ChatClient
      agent-url="/api/agui"
      upload-url="/api/upload"
      tool-execute-url="/api/tools/execute"
      :get-headers="getHeaders"
      :on-error="handleError"
      thread-id="my-session"
      placeholder="Ask me anything..."
    />
  </div>
</template>
```

## 方式二：ChatBox + 自定义逻辑

`ChatBox` 是纯渲染组件，所有数据和逻辑由外部控制。适合有自己的状态管理和 API 层的项目：

```vue
<script setup lang="ts">
import { ref } from "vue";
import { ChatBox } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";
import type { Message, Attachment, StreamingStatus, ChatError } from "@yuworm/agui-antdvn-chat";

const messages = ref<Message[]>([]);
const streamingContent = ref("");
const streamingReasoning = ref("");
const streamingStatus = ref<StreamingStatus>("idle");
const isBusy = ref(false);

async function handleSend(payload: { content: string; attachments: Attachment[] }) {
  messages.value.push({
    id: crypto.randomUUID(),
    role: "user",
    content: payload.content,
    attachments: payload.attachments.length ? payload.attachments : null,
  });

  streamingStatus.value = "streaming";
  isBusy.value = true;
  // ... 调用你的后端 API，处理流式响应
}

function handleStop() {
  // 中止当前请求
}

async function handleUpload(file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  return await res.json();
}

function handleError(error: ChatError) {
  console.error(`${error.type}: ${error.message}`);
}
</script>

<template>
  <div style="height: 100vh">
    <ChatBox
      :messages="messages"
      :streaming-content="streamingContent"
      :streaming-reasoning="streamingReasoning"
      :streaming-status="streamingStatus"
      :disabled="isBusy"
      :upload-handler="handleUpload"
      :on-error="handleError"
      :max-file-size="10 * 1024 * 1024"
      :max-files="5"
      @send="handleSend"
      @stop="handleStop"
    />
  </div>
</template>
```

## 方式三：useChat composable + ChatBox

使用 `useChat` 管理状态和 AG-UI 通信，同时保留对 `ChatBox` UI 的完全控制：

```vue
<script setup lang="ts">
import { ChatBox, useChat } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";

const chat = useChat({
  agentUrl: "/api/agui",
  uploadUrl: "/api/upload",
  toolExecuteUrl: "/api/tools/execute",
  getHeaders: () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }),
  onError: (e) => console.error(e),
  onStreamEnd: (msg) => console.log("Stream ended:", msg.content.slice(0, 50)),
});
</script>

<template>
  <div style="height: 100vh">
    <ChatBox
      :messages="chat.messages.value"
      :streaming-content="chat.streamingContent.value"
      :streaming-reasoning="chat.streamingReasoning.value"
      :streaming-status="chat.streamingStatus.value"
      :pending-tool-calls="chat.pendingToolCalls.value"
      :disabled="chat.isBusy.value"
      :upload-handler="chat.uploadFile"
      @send="chat.send"
      @stop="chat.stop"
      @confirm-tool="(id) => chat.resolveConfirmation(id, true)"
      @reject-tool="(id) => chat.resolveConfirmation(id, false)"
    />
  </div>
</template>
```

> **注意：** `ChatBox` / `ChatClient` 的容器需要有明确的高度（如 `height: 100vh` 或 `height: 400px`），组件内部使用 flex 布局填满容器。
