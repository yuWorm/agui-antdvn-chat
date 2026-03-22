# API 参考

## ChatClient

一体化组件，内置状态管理和 AG-UI 流式通信。配置接口地址和认证信息即可使用，无需自行管理消息状态。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `agentUrl` | `string` | **必填** | AG-UI Agent 端点地址 |
| `uploadUrl` | `string` | — | 文件上传端点地址 |
| `toolExecuteUrl` | `string` | — | 工具执行端点地址 |
| `threadId` | `string` | — | 线程/会话 ID |
| `initialMessages` | `Message[]` | `[]` | 初始消息列表 |
| `getHeaders` | `() => Record<string, string>` | — | 获取请求头（支持异步） |
| `requestInterceptor` | `(config: RequestConfig) => RequestConfig` | — | 请求拦截器 |
| `onError` | `(error: ChatError) => void` | — | 错误回调 |
| `onBeforeSend` | `(payload: SendPayload) => SendPayload \| false` | — | 发送前拦截 |
| `onStreamStart` | `() => void` | — | 流式开始回调 |
| `onStreamEnd` | `(message: Message) => void` | — | 流式结束回调 |
| `onToolCall` | `(toolCall: ToolCallRecord) => void` | — | 工具调用回调 |
| `placeholder` | `string` | `"Type a message..."` | 输入框占位文本 |
| `acceptFileTypes` | `string` | `"image/*,.pdf,..."` | 允许上传的文件类型 |
| `maxFiles` | `number` | — | 最大附件数量 |
| `maxFileSize` | `number` | — | 单个文件最大字节数 |
| `disabled` | `boolean` | `false` | 禁用输入（组件内部 isBusy 时自动禁用） |
| `loading` | `boolean` | `false` | 显示加载状态 |

### Slots

继承全部 [ChatBox Slots](#chatbox-slots)。

### Expose

| 属性 | 类型 | 说明 |
|------|------|------|
| `chat` | `UseChatReturn` | 内部 useChat composable 的完整返回值 |

```vue
<script setup lang="ts">
import { ref } from "vue";
import { ChatClient } from "@yuworm/agui-antdvn-chat";

const chatClientRef = ref();

function clearHistory() {
  chatClientRef.value?.chat.clearMessages();
}
</script>

<template>
  <ChatClient ref="chatClientRef" agent-url="/api/agui" />
  <button @click="clearHistory">Clear</button>
</template>
```

---

## useChat

Composable，管理聊天状态并提供 AG-UI 流式通信、文件上传、工具执行能力。

### 用法

```ts
import { useChat } from "@yuworm/agui-antdvn-chat";

const chat = useChat({
  agentUrl: "/api/agui",
  uploadUrl: "/api/upload",
  toolExecuteUrl: "/api/tools/execute",
  getHeaders: () => ({ Authorization: `Bearer ${token}` }),
  onError: (e) => message.error(e.message),
});
```

### 配置项

参见 [UseChatOptions](types.md#usechatoptions)。

### 返回值

参见 [UseChatReturn](types.md#usechatreturn)。

### 请求流程

1. 调用 `chat.send(payload)` 发送消息
2. `onBeforeSend` 拦截（可修改或取消）
3. `getHeaders()` 获取请求头
4. `requestInterceptor(config)` 拦截请求配置
5. 通过 AG-UI HttpAgent 发起流式请求到 `agentUrl`
6. 流式回调更新 `streamingContent`、`streamingReasoning`
7. 工具调用时更新 `pendingToolCalls`，等待 `resolveConfirmation`
8. 批准后通过 fetch 调用 `toolExecuteUrl` 执行工具
9. 全部完成后 `onStreamEnd` 回调

---

## ChatBox

纯渲染入口组件，包含消息列表 + 输入框，纯 props/events/slots 驱动。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `messages` | `Message[]` | **必填** | 消息列表 |
| `streamingContent` | `string` | `""` | 当前正在流式输出的助手消息内容 |
| `streamingReasoning` | `string` | `""` | 当前正在流式输出的思维链内容 |
| `streamingStatus` | `StreamingStatus` | `"idle"` | 流式状态 |
| `pendingToolCalls` | `ToolCallRecord[]` | `[]` | 当前待处理的工具调用列表 |
| `disabled` | `boolean` | `false` | 禁用输入 |
| `loading` | `boolean` | `false` | 显示加载状态（替代消息列表和欢迎页） |
| `placeholder` | `string` | `"Type a message..."` | 输入框占位文本 |
| `uploadHandler` | `(file: File) => Promise<Attachment>` | — | 文件上传回调 |
| `acceptFileTypes` | `string` | `"image/*,.pdf,..."` | 允许上传的文件类型 |
| `maxFiles` | `number` | — | 最大附件数量 |
| `maxFileSize` | `number` | — | 单个文件最大字节数 |
| `onError` | `(error: ChatError) => void` | — | 错误回调（上传失败、校验失败等） |
| `onBeforeSend` | `(payload: SendPayload) => SendPayload \| false` | — | 发送前拦截 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `send` | `SendPayload` | 用户发送消息时触发 |
| `stop` | — | 用户点击停止按钮时触发 |
| `confirmTool` | `toolCallId: string` | 用户批准工具调用时触发 |
| `rejectTool` | `toolCallId: string` | 用户拒绝工具调用时触发 |

### Slots {#chatbox-slots}

| 插槽 | 作用域数据 | 说明 |
|------|-----------|------|
| `#header` | — | 顶部区域（标题栏、关闭按钮等） |
| `#welcome` | — | 消息列表为空时的欢迎页 |
| `#loading` | — | 自定义加载状态 |
| `#message-user` | `{ message: Message }` | 自定义用户消息渲染 |
| `#message-assistant` | `{ message: Message, streaming: boolean }` | 自定义助手消息渲染 |
| `#message-actions` | `{ message: Message }` | 每条消息下方的操作栏（复制、点赞等） |
| `#assistant-avatar` | — | 自定义助手头像 |
| `#tool-confirm` | `{ toolCall: ToolCallRecord, confirm: (id) => void, reject: (id) => void }` | 自定义工具确认 UI |
| `#tool-card` | `{ toolCall: ToolCallRecord }` | 自定义工具调用卡片 |
| `#input-actions` | — | 输入框底部附件按钮右侧的操作区 |
| `#input-footer` | — | 输入卡片下方的自定义区域 |

```vue
<ChatBox :messages="messages" @send="handleSend">
  <template #header>
    <div class="my-header">AI Assistant</div>
  </template>

  <template #welcome>
    <div>Welcome! Ask me anything.</div>
  </template>

  <template #message-actions="{ message }">
    <button @click="copy(message.content)">Copy</button>
    <button @click="regenerate(message)">Regenerate</button>
  </template>

  <template #assistant-avatar>
    <img src="/bot-avatar.png" width="32" height="32" />
  </template>

  <template #tool-confirm="{ toolCall, confirm, reject }">
    <div class="my-confirm">
      <p>Execute {{ toolCall.name }}?</p>
      <button @click="confirm(toolCall.id)">Yes</button>
      <button @click="reject(toolCall.id)">No</button>
    </div>
  </template>
</ChatBox>
```

---

## MessageList

消息列表渲染，自动滚动到底部。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `messages` | `Message[]` | 消息列表 |
| `streamingContent` | `string` | 流式输出内容 |
| `streamingReasoning` | `string` | 流式思维链内容 |
| `isStreaming` | `boolean` | 是否正在流式输出 |
| `pendingConfirmations` | `ToolCallRecord[]` | 等待用户确认的工具调用 |
| `executingToolCalls` | `ToolCallRecord[]` | 正在执行/已完成的工具调用 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `confirmTool` | `id: string` | 用户批准工具调用 |
| `rejectTool` | `id: string` | 用户拒绝工具调用 |

### Slots

| 插槽 | 作用域数据 | 说明 |
|------|-----------|------|
| `#message-user` | `{ message: Message }` | 自定义用户消息 |
| `#message-assistant` | `{ message: Message, streaming: boolean }` | 自定义助手消息 |
| `#message-actions` | `{ message: Message }` | 消息操作栏 |
| `#assistant-avatar` | — | 自定义助手头像 |
| `#tool-confirm` | `{ toolCall, confirm, reject }` | 自定义工具确认 |
| `#tool-card` | `{ toolCall: ToolCallRecord }` | 自定义工具卡片 |

---

## ChatInput

消息输入框，支持文件上传、粘贴图片、拖拽文件。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disabled` | `boolean` | `false` | 禁用输入，显示停止按钮 |
| `uploadHandler` | `(file: File) => Promise<Attachment>` | — | 文件上传回调 |
| `placeholder` | `string` | `"Type a message..."` | 占位文本 |
| `acceptFileTypes` | `string` | `"image/*,.pdf,..."` | 接受的文件类型 |
| `maxFiles` | `number` | — | 最大附件数量 |
| `maxFileSize` | `number` | — | 单个文件最大字节数 |
| `onError` | `(error: ChatError) => void` | — | 错误回调 |
| `onBeforeSend` | `(payload: SendPayload) => SendPayload \| false` | — | 发送前拦截 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `send` | `SendPayload` | 发送消息 |
| `stop` | — | 点击停止 |

### Slots

| 插槽 | 说明 |
|------|------|
| `#input-actions` | 附件按钮右侧的自定义操作区 |
| `#input-footer` | 输入卡片下方的自定义区域 |

### 输入交互

- `Enter` — 发送消息
- `Shift + Enter` — 换行
- 拖拽文件到输入框 — 添加附件
- 粘贴图片（Ctrl/Cmd + V） — 添加图片附件

### 文件校验

- `maxFiles` — 超过限制时触发 `onError({ type: "upload", message: "..." })`
- `maxFileSize` — 超过限制时触发 `onError({ type: "upload", message: "..." })`

---

## AssistantMessage

渲染单条助手消息，包含 Markdown、思维链、工具调用卡片。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `content` | `string` | 消息内容（Markdown 格式） |
| `reasoning` | `string \| null` | 思维链/推理内容 |
| `streaming` | `boolean` | 是否正在流式输出 |
| `inline` | `boolean` | 内联模式（不显示头像，用于流式区块） |
| `toolCalls` | `ToolCallRecord[] \| null` | 关联的工具调用列表 |

### Slots

| 插槽 | 作用域数据 | 说明 |
|------|-----------|------|
| `#avatar` | — | 自定义助手头像 |
| `#tool-card` | `{ toolCall: ToolCallRecord }` | 自定义工具调用卡片 |

---

## UserMessage

渲染单条用户消息气泡，支持附件显示。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `content` | `string` | 消息文本 |
| `attachments` | `Attachment[] \| null` | 附件列表 |

---

## MarkdownViewer

Markdown 渲染组件，支持流式模式。基于 `markstream-vue`。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `content` | `string` | Markdown 内容 |
| `streaming` | `boolean` | 流式模式 |

---

## ThinkingBlock

可折叠的思维链/推理展示块。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `content` | `string` | 思维链文本 |
| `streaming` | `boolean` | 是否正在输出 |

---

## ToolCallCard

工具调用状态卡片。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `toolCall` | `ToolCallRecord` | 工具调用记录 |

---

## HilConfirm

Human-in-the-Loop 工具调用确认组件。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `toolCall` | `ToolCallRecord` | 待确认的工具调用 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `confirm` | `id: string` | 用户批准 |
| `reject` | `id: string` | 用户拒绝 |

---

## AttachmentPreview

文件/图片附件预览。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `pendingFiles` | `PendingFile[]` | 待上传的文件列表 |
| `attachments` | `Attachment[]` | 已上传的附件列表 |
| `removable` | `boolean` | 是否显示移除按钮 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `remove` | `index: number` | 移除指定文件 |
