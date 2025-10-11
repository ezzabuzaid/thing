import z from 'zod';

import {
  Dispatcher,
  type InstanceType,
  fetchType,
} from '../http/dispatcher.ts';
import {
  type Interceptor,
  createBaseUrlInterceptor,
  createHeadersInterceptor,
} from '../http/interceptors.ts';
import { buffered, chunked } from '../http/parse-response.ts';
import {
  type HeadersInit,
  empty,
  formdata,
  json,
  toRequest,
  urlencoded,
} from '../http/request.ts';
import * as http from '../http/response.ts';
import * as chats from '../inputs/chats.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /chats': {
    schema: chats.getChatsSchema,
    output: [
      http.Ok<outputs.GetChats>,
      http.BadRequest<outputs.GetChats400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof chats.getChatsSchema>) {
      return toRequest(
        'GET /chats',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['page', 'pageSize'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof chats.getChatsSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'GET /chats/{id}': {
    schema: chats.getChatByIdSchema,
    output: [
      http.Ok<outputs.GetChatById>,
      http.BadRequest<outputs.GetChatById400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof chats.getChatByIdSchema>) {
      return toRequest(
        'GET /chats/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof chats.getChatByIdSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'PUT /chats/{id}': {
    schema: chats.updateChatSchema,
    output: [
      http.Ok<outputs.UpdateChat>,
      http.BadRequest<outputs.UpdateChat400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof chats.updateChatSchema>) {
      return toRequest(
        'PUT /chats/{id}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title'],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof chats.updateChatSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'DELETE /chats/{id}': {
    schema: chats.deleteChatSchema,
    output: [
      http.NoContent,
      http.BadRequest<outputs.DeleteChat400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof chats.deleteChatSchema>) {
      return toRequest(
        'DELETE /chats/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof chats.deleteChatSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'DELETE /messages/{id}': {
    schema: chats.deleteMessageSchema,
    output: [
      http.NoContent,
      http.BadRequest<outputs.DeleteMessage400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof chats.deleteMessageSchema>) {
      return toRequest(
        'DELETE /messages/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof chats.deleteMessageSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
};
