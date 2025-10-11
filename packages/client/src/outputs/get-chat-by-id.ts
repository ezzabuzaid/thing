import type * as models from '../index.ts';

export type GetChatById = {
  messages: {
    parts: {
      type: string;
      id: string;
      messageId: string;
      text_text: string;
      reasoning_text: string;
      file_mediaType: string;
      file_filename: string;
      file_url: string;
      source_url_sourceId: string;
      source_url_url: string;
      source_url_title: string;
      source_document_sourceId: string;
      source_document_mediaType: string;
      source_document_title: string;
      source_document_filename: string;
      tool_toolCallId: string;
      tool_toolName: string;
      tool_state: string;
      tool_errorText: string;
      tool_input: string;
      tool_output: string;
      providerMetadata: models.JsonValue;
    }[];
    id: string;
    chatId: string;
    role: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
    finishReason: string;
    traceId: string;
  }[];
  id: string;
  userId: string;
  title: string;
};

export type GetChatById400 = models.ValidationError;
