# @yuworm/agui-antdvn-chat

Vue 3 AI 对话组件库，提供开箱即用的 Chat UI。支持两种使用姿势：纯渲染模式（ChatBox）和一体化模式（ChatClient）。

## 特性

- **两层架构** — `ChatBox` 纯渲染层零业务耦合；`ChatClient` 一体化层配置即用
- **完整对话能力** — 消息列表、流式输出、Markdown 渲染、思维链展示、工具调用卡片、Human-in-the-Loop 确认
- **内置 AG-UI 协议** — `useChat` composable 内置 AG-UI 流式通信、文件上传、工具执行
- **请求配置** — 支持自定义接口地址、请求头注入、请求拦截器、错误回调
- **丰富插槽** — 11 个插槽覆盖欢迎页、消息渲染、头像、工具确认、操作栏等
- **文件上传** — 支持点击上传、拖拽上传、剪贴板粘贴图片，含文件大小/数量校验
- **主题系统** — 基于 CSS 变量，内置 light/dark 双主题，支持完全自定义
- **零 UI 框架依赖** — 不依赖 Ant Design、Element Plus 等，纯原生 HTML + CSS
- **TypeScript** — 完整类型定义，开发体验友好

## 安装

```bash
npm install @yuworm/agui-antdvn-chat
```

**Peer Dependencies:**

| 依赖 | 版本 | 必需 | 说明 |
|------|------|------|------|
| `vue` | `^3.3.0` | 是 | Vue 3 核心 |
| `markstream-vue` | `^0.0.10-beta.1` | 是 | Markdown 流式渲染 |
| `@ag-ui/client` | `^0.0.47` | 否 | 仅 `useChat` / `ChatClient` 需要 |
| `@ag-ui/core` | `^0.0.47` | 否 | 仅 `useChat` / `ChatClient` 需要 |

## 快速上手

### 方式一：ChatClient（推荐，开箱即用）

配置接口地址和请求头即可使用，无需自行管理状态和 API 调用。

```vue
<script setup lang="ts">
import { ChatClient } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import "@yuworm/agui-antdvn-chat/dist/theme/variables.css";

const token = localStorage.getItem("access_token") || "";
</script>

<template>
  <div style="height: 100vh">
    <ChatClient
      agent-url="/api/agui"
      upload-url="/api/upload"
      tool-execute-url="/api/tools/execute"
      :get-headers="() => ({ Authorization: `Bearer ${token}` })"
      :on-error="(e) => console.error(e)"
      thread-id="session-123"
    />
  </div>
</template>
```

### 方式二：ChatBox（纯渲染，完全控制）

自行管理消息状态和 API 调用逻辑，组件只负责渲染。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { ChatBox } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";

const messages = ref([]);
</script>

<template>
  <div style="height: 100vh">
    <ChatBox
      :messages="messages"
      :upload-handler="handleUpload"
      :on-error="handleError"
      @send="handleSend"
      @stop="handleStop"
    />
  </div>
</template>
```

## 文档

| 文档 | 说明 |
|------|------|
| [快速开始](docs/getting-started.md) | 安装、引入样式、ChatClient 和 ChatBox 两种使用方式 |
| [API 参考](docs/api-reference.md) | ChatClient / ChatBox / useChat 及全部子组件的完整 API |
| [类型定义](docs/types.md) | 所有导出类型的详细说明 |
| [主题定制](docs/theming.md) | CSS 变量体系、light/dark 主题、完整变量清单 |
| [使用示例](docs/examples.md) | ChatClient 集成、自定义插槽、自定义布局等场景 |

## 导出一览

### 组件

| 组件 | 说明 |
|------|------|
| `ChatClient` | **一体化组件**，内置状态管理 + AG-UI 通信，配置即用 |
| `ChatBox` | 纯渲染入口，包含 MessageList + ChatInput，纯 props/events 驱动 |
| `ChatInput` | 消息输入框（文件上传 / 粘贴图片 / 拖拽） |
| `MessageList` | 消息列表（自动滚动，支持消息级插槽） |
| `AssistantMessage` | 助手消息（Markdown / 思维链 / 工具调用） |
| `UserMessage` | 用户消息气泡 |
| `MarkdownViewer` | Markdown 流式渲染 |
| `ThinkingBlock` | 可折叠思维链展示 |
| `ToolCallCard` | 工具调用状态卡片 |
| `HilConfirm` | Human-in-the-Loop 确认 |
| `AttachmentPreview` | 文件 / 图片附件预览 |

### Composable

| Composable | 说明 |
|------------|------|
| `useChat(options)` | 聊天状态管理 + AG-UI 流式通信 + 文件上传 + 工具执行 |

### 类型

`Message` / `Attachment` / `ToolCallRecord` / `StreamingStatus` / `PendingFile` / `ChatBoxProps` / `ChatBoxEmits` / `ChatError` / `UseChatOptions` / `ChatClientProps` / `RequestConfig` / `SendPayload` / `UseChatReturn`

## 开发

```bash
npm install     # 安装依赖
npm run dev     # watch 构建
npm run build   # 生产构建
```

## License

MIT
