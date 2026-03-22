import { HttpAgent } from "@ag-ui/client";
import type { AgentSubscriber } from "@ag-ui/client";
import type { Message as AGUIMessage } from "@ag-ui/core";
import { computed, readonly, ref, type DeepReadonly, type Ref } from "vue";
import type {
  Attachment,
  ChatError,
  Message,
  RequestConfig,
  SendPayload,
  StreamingStatus,
  ToolCallRecord,
  UseChatOptions,
} from "../types";

export interface UseChatReturn {
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

export function useChat(options: UseChatOptions): UseChatReturn {
  const messages = ref<Message[]>([...(options.initialMessages ?? [])]);
  const streamingContent = ref("");
  const streamingReasoning = ref("");
  const streamingStatus = ref<StreamingStatus>("idle");
  const pendingToolCalls = ref<ToolCallRecord[]>([]);
  const sending = ref(false);

  let currentAgent: HttpAgent | null = null;
  let confirmResolve: (() => void) | null = null;

  const isBusy = computed(
    () =>
      sending.value ||
      streamingStatus.value === "streaming" ||
      streamingStatus.value === "confirming" ||
      streamingStatus.value === "executing",
  );

  // ---------------------------------------------------------------------------
  // Header resolution
  // ---------------------------------------------------------------------------

  async function resolveHeaders(): Promise<Record<string, string>> {
    if (options.getHeaders) {
      return await options.getHeaders();
    }
    return {};
  }

  async function applyInterceptor(
    config: RequestConfig,
  ): Promise<RequestConfig> {
    if (options.requestInterceptor) {
      return await options.requestInterceptor(config);
    }
    return config;
  }

  function emitError(error: ChatError) {
    if (options.onError) {
      options.onError(error);
    } else {
      console.error(
        `[@yuworm/agui-antdvn-chat] ${error.type}: ${error.message}`,
        error.originalError,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // AG-UI Agent
  // ---------------------------------------------------------------------------

  function buildAGUIMessages(
    history: { role: string; content: string }[],
  ): AGUIMessage[] {
    return history.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));
  }

  async function createAgent(
    threadId: string,
    aguiMessages: AGUIMessage[],
  ): Promise<HttpAgent> {
    const headers = await resolveHeaders();
    const config = await applyInterceptor({
      url: options.agentUrl,
      headers,
    });

    const agent = new HttpAgent({
      url: config.url,
      headers: config.headers,
      threadId,
      initialMessages: aguiMessages,
    });
    currentAgent = agent;
    return agent;
  }

  function buildSubscriber() {
    let fullContent = "";
    let fullReasoning = "";
    let currentToolCall: ToolCallRecord | null = null;

    const subscriber: AgentSubscriber = {
      onTextMessageContentEvent({ textMessageBuffer }) {
        fullContent = textMessageBuffer;
        streamingContent.value = fullContent;
      },
      onReasoningMessageContentEvent({ reasoningMessageBuffer }) {
        fullReasoning = reasoningMessageBuffer;
        streamingReasoning.value = fullReasoning;
      },
      onToolCallStartEvent({ event }) {
        currentToolCall = {
          id: event.toolCallId || crypto.randomUUID(),
          name: event.toolCallName || "",
          arguments: {},
          status: "pending",
        };
        pendingToolCalls.value.push(currentToolCall);
        options.onToolCall?.(currentToolCall);
      },
      onToolCallArgsEvent({ partialToolCallArgs }) {
        if (currentToolCall) {
          currentToolCall.arguments = { ...partialToolCallArgs };
        }
      },
      onToolCallEndEvent({ toolCallArgs }) {
        if (currentToolCall) {
          currentToolCall.arguments = { ...toolCallArgs };
          currentToolCall.status = "awaiting_confirmation";
          currentToolCall = null;
        }
      },
      onToolCallResultEvent({ event }) {
        const tc = pendingToolCalls.value.find(
          (t) => t.id === event.toolCallId,
        );
        if (tc) {
          tc.result = event.content;
          tc.status = "completed";
        }
      },
      onRunErrorEvent() {
        streamingStatus.value = "error";
        emitError({ type: "stream", message: "Agent run encountered an error" });
      },
    };

    return {
      subscriber,
      getContent: () => fullContent,
      getReasoning: () => fullReasoning,
    };
  }

  async function runAgentCall(
    threadId: string,
    aguiMessages: AGUIMessage[],
  ): Promise<{ content: string; reasoning: string }> {
    const agent = await createAgent(threadId, aguiMessages);
    const { subscriber, getContent, getReasoning } = buildSubscriber();
    await agent.runAgent({}, subscriber);
    return { content: getContent(), reasoning: getReasoning() };
  }

  // ---------------------------------------------------------------------------
  // Tool confirmation flow
  // ---------------------------------------------------------------------------

  function waitForAllSettled(): Promise<void> {
    return new Promise((resolve) => {
      confirmResolve = resolve;
      checkAllSettled();
    });
  }

  function checkAllSettled() {
    const hasPending = pendingToolCalls.value.some(
      (t) =>
        t.status === "awaiting_confirmation" || t.status === "executing",
    );
    if (!hasPending && confirmResolve) {
      confirmResolve();
      confirmResolve = null;
    }
  }

  async function executeToolCall(tc: ToolCallRecord) {
    tc.status = "executing";
    streamingStatus.value = "executing";

    if (!options.toolExecuteUrl) {
      tc.result = "No toolExecuteUrl configured";
      tc.status = "error";
      emitError({
        type: "tool_execute",
        message: "No toolExecuteUrl configured",
      });
      checkAllSettled();
      return;
    }

    try {
      const headers = await resolveHeaders();
      const config = await applyInterceptor({
        url: options.toolExecuteUrl,
        headers: { "Content-Type": "application/json", ...headers },
        body: { name: tc.name, arguments: tc.arguments },
      });

      const response = await fetch(config.url, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify(config.body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      tc.result = data.result;
      tc.status = "completed";
    } catch (err) {
      tc.result = `Execution failed: ${err}`;
      tc.status = "error";
      emitError({
        type: "tool_execute",
        message: `Tool "${tc.name}" execution failed`,
        originalError: err,
      });
    }
    checkAllSettled();
  }

  function resolveConfirmation(toolCallId: string, approved: boolean) {
    const tc = pendingToolCalls.value.find((t) => t.id === toolCallId);
    if (!tc) return;

    if (approved) {
      executeToolCall(tc);
    } else {
      tc.status = "rejected";
      tc.result = "Tool call was denied by user.";
      checkAllSettled();
    }
  }

  async function handleConfirmedTools(
    threadId: string,
    previousMessages: AGUIMessage[],
    partialContent: string,
    partialReasoning: string,
  ) {
    await waitForAllSettled();

    const snapshotToolCalls = pendingToolCalls.value.map((tc) => ({
      ...tc,
    }));
    const hasApproved = snapshotToolCalls.some(
      (t) => t.status === "completed",
    );

    if (!hasApproved) {
      finalizeMessage(partialContent, partialReasoning, snapshotToolCalls);
      return;
    }

    commitMessage(partialContent, partialReasoning, snapshotToolCalls);

    const assistantMsg: AGUIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: partialContent || "",
      toolCalls: pendingToolCalls.value.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
      })),
    };

    const toolResultMsgs: AGUIMessage[] = pendingToolCalls.value.map(
      (tc) => ({
        id: crypto.randomUUID(),
        role: "tool" as const,
        content: tc.result || "No result",
        toolCallId: tc.id,
      }),
    );

    const extendedMessages = [
      ...previousMessages,
      assistantMsg,
      ...toolResultMsgs,
    ];

    streamingStatus.value = "streaming";
    streamingContent.value = "";
    streamingReasoning.value = "";
    pendingToolCalls.value = [];

    try {
      const { content, reasoning } = await runAgentCall(
        threadId,
        extendedMessages,
      );

      const deferredCalls = pendingToolCalls.value.filter(
        (t) => t.status === "awaiting_confirmation",
      );

      if (deferredCalls.length > 0) {
        streamingStatus.value = "confirming";
        await handleConfirmedTools(
          threadId,
          extendedMessages,
          content,
          reasoning,
        );
        return;
      }

      finalizeMessage(content, reasoning, []);
    } catch (err) {
      streamingStatus.value = "error";
      emitError({
        type: "stream",
        message: "Streaming failed after tool execution",
        originalError: err,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Message management
  // ---------------------------------------------------------------------------

  function commitMessage(
    content: string,
    reasoning: string,
    toolCalls: ToolCallRecord[],
  ) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      reasoning: reasoning || null,
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
      created_at: new Date().toISOString(),
    });
  }

  function finalizeMessage(
    content: string,
    reasoning: string,
    toolCalls: ToolCallRecord[],
  ) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      reasoning: reasoning || null,
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
      created_at: new Date().toISOString(),
    });
    streamingContent.value = "";
    streamingReasoning.value = "";
    streamingStatus.value = "idle";
    pendingToolCalls.value = [];
    options.onStreamEnd?.(messages.value[messages.value.length - 1]);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async function send(payload: SendPayload) {
    if (sending.value || isBusy.value) return;

    let finalPayload = payload;
    if (options.onBeforeSend) {
      const result = await options.onBeforeSend(payload);
      if (result === false) return;
      finalPayload = result;
    }

    sending.value = true;

    try {
      const threadId = options.threadId || crypto.randomUUID();

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: finalPayload.content,
        attachments: finalPayload.attachments.length
          ? finalPayload.attachments
          : null,
        created_at: new Date().toISOString(),
      };
      messages.value.push(userMsg);

      const history = messages.value.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const aguiMessages = buildAGUIMessages(history);

      streamingStatus.value = "streaming";
      streamingContent.value = "";
      streamingReasoning.value = "";
      pendingToolCalls.value = [];

      options.onStreamStart?.();

      const { content, reasoning } = await runAgentCall(
        threadId,
        aguiMessages,
      );

      const deferredCalls = pendingToolCalls.value.filter(
        (t) => t.status === "awaiting_confirmation",
      );

      if (deferredCalls.length > 0) {
        streamingStatus.value = "confirming";
        await handleConfirmedTools(
          threadId,
          aguiMessages,
          content,
          reasoning,
        );
        return;
      }

      finalizeMessage(content, reasoning, []);
    } catch (err) {
      streamingStatus.value = "error";
      emitError({
        type: "send",
        message: "Failed to send message",
        originalError: err,
      });
    } finally {
      sending.value = false;
    }
  }

  function stop() {
    if (currentAgent) {
      currentAgent.abortRun();
    }
    currentAgent = null;
    if (confirmResolve) {
      confirmResolve();
      confirmResolve = null;
    }
    streamingStatus.value = "idle";
  }

  async function uploadFile(file: File): Promise<Attachment> {
    if (!options.uploadUrl) {
      throw new Error("No uploadUrl configured");
    }

    const headers = await resolveHeaders();
    const form = new FormData();
    form.append("file", file);

    const config = await applyInterceptor({
      url: options.uploadUrl,
      headers,
    });

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers,
      body: form,
    });

    if (!response.ok) {
      const error = new Error(
        `Upload failed: HTTP ${response.status}`,
      );
      emitError({
        type: "upload",
        message: `File upload failed: ${response.statusText}`,
        originalError: error,
      });
      throw error;
    }

    return await response.json();
  }

  function clearMessages() {
    messages.value = [];
    streamingContent.value = "";
    streamingReasoning.value = "";
    streamingStatus.value = "idle";
    pendingToolCalls.value = [];
  }

  function setMessages(msgs: Message[]) {
    messages.value = [...msgs];
  }

  return {
    messages: readonly(messages),
    streamingContent: readonly(streamingContent),
    streamingReasoning: readonly(streamingReasoning),
    streamingStatus: readonly(streamingStatus),
    pendingToolCalls: readonly(pendingToolCalls),
    isBusy: readonly(isBusy),

    send,
    stop,
    resolveConfirmation,
    uploadFile,
    clearMessages,
    setMessages,
  };
}
