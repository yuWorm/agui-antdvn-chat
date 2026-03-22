# 类型定义

所有类型均从包入口导出：

```ts
import type {
  Message,
  Attachment,
  ToolCallRecord,
  StreamingStatus,
  PendingFile,
  ChatBoxProps,
  ChatBoxEmits,
  ChatError,
  UseChatOptions,
  ChatClientProps,
  RequestConfig,
  SendPayload,
  UseChatReturn,
} from "@yuworm/agui-antdvn-chat";
```

---

## Message

对话消息结构。

```typescript
interface Message {
  id: string;
  session_id?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning?: string | null;
  tool_calls?: ToolCallRecord[] | null;
  attachments?: Attachment[] | null;
  metadata_?: Record<string, unknown> | null;
  ordering?: number;
  created_at?: string;
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 消息唯一标识 |
| `session_id` | `string` | 否 | 所属会话 ID |
| `role` | `"user" \| "assistant" \| "system" \| "tool"` | 是 | 消息角色 |
| `content` | `string` | 是 | 消息文本内容（助手消息支持 Markdown） |
| `reasoning` | `string \| null` | 否 | 思维链/推理内容 |
| `tool_calls` | `ToolCallRecord[] \| null` | 否 | 关联的工具调用 |
| `attachments` | `Attachment[] \| null` | 否 | 文件附件 |
| `metadata_` | `Record<string, unknown> \| null` | 否 | 自定义元数据 |
| `ordering` | `number` | 否 | 消息排序号 |
| `created_at` | `string` | 否 | 创建时间 (ISO 8601) |

---

## Attachment

文件附件结构，由 `uploadHandler` 回调返回。

```typescript
interface Attachment {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 附件唯一标识 |
| `filename` | `string` | 文件名 |
| `url` | `string` | 文件访问 URL |
| `mime_type` | `string` | MIME 类型，如 `"image/png"`, `"application/pdf"` |
| `size` | `number` | 文件大小（字节） |

---

## ToolCallRecord

工具调用记录，贯穿工具调用的完整生命周期。

```typescript
interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status:
    | "pending"
    | "awaiting_confirmation"
    | "confirmed"
    | "rejected"
    | "executing"
    | "completed"
    | "error";
}
```

### status 状态流转

```
pending → awaiting_confirmation → confirmed → executing → completed
                                ↘ rejected                ↘ error
```

| 状态 | 说明 |
|------|------|
| `pending` | 等待执行 |
| `awaiting_confirmation` | 等待用户确认 (Human-in-the-Loop) |
| `confirmed` | 用户已批准 |
| `rejected` | 用户已拒绝 |
| `executing` | 正在执行 |
| `completed` | 执行完成 |
| `error` | 执行失败 |

---

## StreamingStatus

流式输出状态枚举，控制 ChatBox 的 UI 表现。

```typescript
type StreamingStatus =
  | "idle"
  | "streaming"
  | "confirming"
  | "executing"
  | "error";
```

| 值 | 说明 | UI 表现 |
|----|------|---------|
| `"idle"` | 空闲 | 正常输入状态 |
| `"streaming"` | 流式输出中 | 显示 Thinking 动画或流式消息 |
| `"confirming"` | 等待工具确认 | 显示 HilConfirm 确认组件 |
| `"executing"` | 工具执行中 | 显示 ToolCallCard 执行状态 |
| `"error"` | 出错 | 错误状态 |

---

## ChatError

统一错误结构，用于 `onError` 回调。

```typescript
interface ChatError {
  type: "send" | "upload" | "tool_execute" | "stream" | "network";
  message: string;
  originalError?: unknown;
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 错误类别 |
| `message` | `string` | 人类可读的错误描述 |
| `originalError` | `unknown` | 原始错误对象（如 fetch Error） |

### type 枚举

| 值 | 说明 |
|----|------|
| `"send"` | 发送消息失败 |
| `"upload"` | 文件上传失败（含文件校验错误） |
| `"tool_execute"` | 工具执行失败 |
| `"stream"` | 流式通信错误 |
| `"network"` | 网络错误 |

---

## SendPayload

发送消息的载荷结构。

```typescript
type SendPayload = {
  content: string;
  attachments: Attachment[];
};
```

---

## RequestConfig

请求拦截器的配置结构。

```typescript
interface RequestConfig {
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}
```

用于 `requestInterceptor` 回调，可在请求发出前修改 URL、headers 或 body。

---

## UseChatOptions

`useChat` composable 的配置选项。

```typescript
interface UseChatOptions {
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
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agentUrl` | `string` | 是 | AG-UI Agent 端点地址 |
| `uploadUrl` | `string` | 否 | 文件上传端点地址 |
| `toolExecuteUrl` | `string` | 否 | 工具执行端点地址 |
| `threadId` | `string` | 否 | 线程/会话 ID（不传则自动生成 UUID） |
| `initialMessages` | `Message[]` | 否 | 初始消息列表 |
| `getHeaders` | `() => Record<string, string>` | 否 | 获取请求头（支持异步），用于注入 Authorization 等 |
| `requestInterceptor` | `(config) => config` | 否 | 请求拦截器，可修改 URL/headers/body |
| `onError` | `(error: ChatError) => void` | 否 | 错误回调 |
| `onBeforeSend` | `(payload) => payload \| false` | 否 | 发送前拦截，返回 `false` 取消发送 |
| `onStreamStart` | `() => void` | 否 | 流式开始回调 |
| `onStreamEnd` | `(message: Message) => void` | 否 | 流式结束回调，参数为最终的助手消息 |
| `onToolCall` | `(toolCall: ToolCallRecord) => void` | 否 | 工具调用开始回调 |

---

## UseChatReturn

`useChat` composable 的返回值类型。

```typescript
interface UseChatReturn {
  messages: DeepReadonly<Ref<Message[]>>;
  streamingContent: Readonly<Ref<string>>;
  streamingReasoning: Readonly<Ref<string>>;
  streamingStatus: Readonly<Ref<StreamingStatus>>;
  pendingToolCalls: DeepReadonly<Ref<ToolCallRecord[]>>;
  isBusy: Readonly<Ref<boolean>>;

  send: (payload: SendPayload) => Promise<void>;
  stop: () => void;
  resolveConfirmation: (toolCallId: string, approved: boolean) => void;
  uploadFile: (file: File) => Promise<Attachment>;
  clearMessages: () => void;
  setMessages: (msgs: Message[]) => void;
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `messages` | `Readonly<Ref<Message[]>>` | 消息列表（只读响应式） |
| `streamingContent` | `Readonly<Ref<string>>` | 当前流式输出的内容 |
| `streamingReasoning` | `Readonly<Ref<string>>` | 当前流式输出的思维链 |
| `streamingStatus` | `Readonly<Ref<StreamingStatus>>` | 流式状态 |
| `pendingToolCalls` | `Readonly<Ref<ToolCallRecord[]>>` | 待处理的工具调用列表 |
| `isBusy` | `Readonly<Ref<boolean>>` | 是否正在处理中 |
| `send` | `(payload) => Promise<void>` | 发送消息 |
| `stop` | `() => void` | 中止当前流 |
| `resolveConfirmation` | `(id, approved) => void` | 处理工具调用确认/拒绝 |
| `uploadFile` | `(file) => Promise<Attachment>` | 上传文件 |
| `clearMessages` | `() => void` | 清空所有消息 |
| `setMessages` | `(msgs) => void` | 替换消息列表 |

---

## PendingFile

待上传文件结构，用于 AttachmentPreview 组件的输入框预览模式。

```typescript
interface PendingFile {
  file: File;
  previewUrl?: string;
}
```

---

## ChatBoxProps

ChatBox 组件的完整 Props 类型。

```typescript
interface ChatBoxProps {
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
  onBeforeSend?: (payload: SendPayload) => SendPayload | false | Promise<SendPayload | false>;
}
```

---

## ChatBoxEmits

ChatBox 组件的完整 Events 类型。

```typescript
interface ChatBoxEmits {
  send: [payload: SendPayload];
  stop: [];
  confirmTool: [toolCallId: string];
  rejectTool: [toolCallId: string];
}
```

---

## ChatClientProps

ChatClient 组件的完整 Props 类型，是 ChatBox 视觉 Props + UseChatOptions 的联合。

```typescript
interface ChatClientProps {
  agentUrl: string;
  uploadUrl?: string;
  toolExecuteUrl?: string;
  threadId?: string;
  initialMessages?: Message[];

  getHeaders?: (() => Record<string, string>) | (() => Promise<Record<string, string>>);
  requestInterceptor?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

  onError?: (error: ChatError) => void;
  onBeforeSend?: (payload: SendPayload) => SendPayload | false | Promise<SendPayload | false>;
  onStreamStart?: () => void;
  onStreamEnd?: (message: Message) => void;
  onToolCall?: (toolCall: ToolCallRecord) => void;

  placeholder?: string;
  acceptFileTypes?: string;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  loading?: boolean;
}
```
