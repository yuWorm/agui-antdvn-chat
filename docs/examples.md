# 使用示例

## ChatClient 快速集成

最简单的接入方式，只需配置接口地址和认证信息：

```vue
<script setup lang="ts">
import { ChatClient } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";

function getHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}
</script>

<template>
  <div style="height: 100vh">
    <ChatClient
      agent-url="/api/agui"
      upload-url="/api/upload"
      tool-execute-url="/api/tools/execute"
      :get-headers="getHeaders"
      :on-error="(e) => alert(e.message)"
      thread-id="session-001"
    />
  </div>
</template>
```

---

## ChatClient + 请求拦截器

使用 `requestInterceptor` 在每次请求前动态修改配置：

```vue
<script setup lang="ts">
import { ChatClient } from "@yuworm/agui-antdvn-chat";
import type { RequestConfig } from "@yuworm/agui-antdvn-chat";

async function interceptor(config: RequestConfig): Promise<RequestConfig> {
  const token = await refreshTokenIfNeeded();
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      "X-Tenant-Id": "tenant-123",
    },
  };
}
</script>

<template>
  <ChatClient
    agent-url="/api/agui"
    upload-url="/api/upload"
    :request-interceptor="interceptor"
  />
</template>
```

---

## ChatClient + 自定义插槽

利用插槽定制品牌化界面：

```vue
<ChatClient
  agent-url="/api/agui"
  upload-url="/api/upload"
  :get-headers="getHeaders"
  :max-files="3"
  :max-file-size="10 * 1024 * 1024"
>
  <!-- 自定义顶栏 -->
  <template #header>
    <div class="my-header">
      <img src="/logo.svg" height="24" />
      <span>AI Assistant</span>
    </div>
  </template>

  <!-- 自定义欢迎页 -->
  <template #welcome>
    <div class="welcome-page">
      <h1>Welcome!</h1>
      <p>I can help with product questions.</p>
    </div>
  </template>

  <!-- 自定义助手头像 -->
  <template #assistant-avatar>
    <img src="/bot.png" width="32" height="32" style="border-radius: 8px" />
  </template>

  <!-- 消息操作栏 -->
  <template #message-actions="{ message }">
    <div class="actions" v-if="message.role === 'assistant'">
      <button @click="copy(message.content)">Copy</button>
      <button @click="like(message.id)">Like</button>
    </div>
  </template>
</ChatClient>
```

---

## ChatClient + 访问内部状态

通过 `ref` 访问 `ChatClient` 暴露的 `chat` 对象：

```vue
<script setup lang="ts">
import { ref } from "vue";
import { ChatClient } from "@yuworm/agui-antdvn-chat";

const clientRef = ref();

function clearAll() {
  clientRef.value?.chat.clearMessages();
}

function loadHistory(messages) {
  clientRef.value?.chat.setMessages(messages);
}
</script>

<template>
  <div>
    <button @click="clearAll">Clear Chat</button>
    <ChatClient ref="clientRef" agent-url="/api/agui" />
  </div>
</template>
```

---

## useChat + ChatBox（完全控制模式）

使用 `useChat` 获得 AG-UI 通信能力，同时完全控制 ChatBox 的渲染：

```vue
<script setup lang="ts">
import { ChatBox, useChat } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";

const chat = useChat({
  agentUrl: "/api/agui",
  uploadUrl: "/api/upload",
  toolExecuteUrl: "/api/tools/execute",
  getHeaders: () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }),
  onError: (e) => console.error(e),
  onBeforeSend: (payload) => {
    if (payload.content.length > 5000) {
      alert("Message too long!");
      return false;
    }
    return payload;
  },
  onStreamStart: () => console.log("Streaming started"),
  onStreamEnd: (msg) => {
    console.log("Stream ended:", msg.content.slice(0, 50));
    saveToDatabase(msg);
  },
  onToolCall: (tc) => console.log("Tool called:", tc.name),
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
    >
      <template #message-actions="{ message }">
        <button @click="copy(message.content)">Copy</button>
      </template>
    </ChatBox>
  </div>
</template>
```

---

## ChatBox 手动状态管理（不使用 AG-UI）

如果你的后端不使用 AG-UI 协议，可以直接使用 ChatBox + 自己的 API 逻辑：

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import { ChatBox } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";
import type { Message, Attachment, StreamingStatus, ToolCallRecord } from "@yuworm/agui-antdvn-chat";

const messages = ref<Message[]>([]);
const streamingContent = ref("");
const streamingReasoning = ref("");
const streamingStatus = ref<StreamingStatus>("idle");
const pendingToolCalls = ref<ToolCallRecord[]>([]);

const isBusy = computed(() =>
  streamingStatus.value === "streaming" ||
  streamingStatus.value === "confirming" ||
  streamingStatus.value === "executing"
);

async function handleSend(payload: { content: string; attachments: Attachment[] }) {
  messages.value.push({
    id: crypto.randomUUID(),
    role: "user",
    content: payload.content,
    attachments: payload.attachments.length ? payload.attachments : null,
  });

  streamingStatus.value = "streaming";
  streamingContent.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.value }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamingContent.value += decoder.decode(value);
    }

    messages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: streamingContent.value,
    });
  } finally {
    streamingContent.value = "";
    streamingStatus.value = "idle";
  }
}

async function handleUpload(file: File): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  return res.json();
}
</script>

<template>
  <div style="height: 100vh">
    <ChatBox
      :messages="messages"
      :streaming-content="streamingContent"
      :streaming-reasoning="streamingReasoning"
      :streaming-status="streamingStatus"
      :pending-tool-calls="pendingToolCalls"
      :disabled="isBusy"
      :upload-handler="handleUpload"
      :on-error="(e) => console.error(e)"
      :max-file-size="10 * 1024 * 1024"
      :max-files="5"
      @send="handleSend"
      @stop="() => (streamingStatus = 'idle')"
    />
  </div>
</template>
```

---

## 嵌入弹窗 / 抽屉

ChatClient 或 ChatBox 可以嵌入到任何有固定高度的容器中：

```vue
<template>
  <a-drawer title="AI Assistant" :open="open" @close="close">
    <div style="height: 100%">
      <ChatClient
        agent-url="/api/agui"
        upload-url="/api/upload"
        :get-headers="getHeaders"
        placeholder="Quick question..."
      />
    </div>
  </a-drawer>
</template>
```

---

## 自定义工具确认 UI

通过 `#tool-confirm` 插槽完全控制工具确认界面：

```vue
<ChatClient agent-url="/api/agui" tool-execute-url="/api/tools/execute">
  <template #tool-confirm="{ toolCall, confirm, reject }">
    <div class="custom-confirm-dialog">
      <h4>Execute "{{ toolCall.name }}"?</h4>
      <pre>{{ JSON.stringify(toolCall.arguments, null, 2) }}</pre>
      <div class="actions">
        <button class="btn-approve" @click="confirm(toolCall.id)">
          Approve
        </button>
        <button class="btn-deny" @click="reject(toolCall.id)">
          Deny
        </button>
      </div>
    </div>
  </template>
</ChatClient>
```

---

## 自定义消息渲染

通过 `#message-user` 和 `#message-assistant` 插槽替换默认的消息渲染：

```vue
<ChatClient agent-url="/api/agui">
  <template #message-user="{ message }">
    <div class="my-user-msg">
      <span class="user-label">You</span>
      <p>{{ message.content }}</p>
    </div>
  </template>

  <template #message-assistant="{ message, streaming }">
    <div class="my-assistant-msg" :class="{ streaming }">
      <img src="/bot.png" width="24" />
      <div v-html="renderMarkdown(message.content)" />
    </div>
  </template>
</ChatClient>
```

---

## 仅使用子组件自定义布局

不使用 ChatBox / ChatClient，直接组合子组件实现完全自定义布局：

```vue
<script setup lang="ts">
import { MessageList, ChatInput, useChat } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";

const chat = useChat({ agentUrl: "/api/agui" });
</script>

<template>
  <div class="custom-layout">
    <header>
      <h3>Support Chat</h3>
      <button @click="chat.clearMessages()">Clear</button>
    </header>

    <MessageList
      :messages="chat.messages.value"
      :streaming-content="chat.streamingContent.value"
      :streaming-reasoning="chat.streamingReasoning.value"
      :is-streaming="chat.streamingStatus.value === 'streaming'"
      :pending-confirmations="[]"
      :executing-tool-calls="[]"
    />

    <ChatInput
      :disabled="chat.isBusy.value"
      :upload-handler="chat.uploadFile"
      @send="chat.send"
      @stop="chat.stop"
    />
  </div>
</template>
```

---

## 纯消息展示（只读模式）

不需要输入框，仅展示历史消息：

```vue
<script setup lang="ts">
import { MessageList } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import type { Message } from "@yuworm/agui-antdvn-chat";

const props = defineProps<{ messages: Message[] }>();
</script>

<template>
  <MessageList
    :messages="messages"
    streaming-content=""
    streaming-reasoning=""
    :is-streaming="false"
    :pending-confirmations="[]"
    :executing-tool-calls="[]"
  />
</template>
```
