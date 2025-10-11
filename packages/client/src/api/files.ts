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
import * as files from '../inputs/files.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /signed-url': {
    schema: files.getSignedUrlSchema,
    output: [
      http.Ok<outputs.GetSignedUrl>,
      http.BadRequest<outputs.GetSignedUrl400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof files.getSignedUrlSchema>) {
      return toRequest(
        'POST /signed-url',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['name', 'type', 'size'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof files.getSignedUrlSchema>,
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
  'GET /files': {
    schema: files.getFilesSchema,
    output: [
      http.Ok<outputs.GetFiles>,
      http.BadRequest<outputs.GetFiles400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof files.getFilesSchema>) {
      return toRequest(
        'GET /files',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['userId'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof files.getFilesSchema>,
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
  'GET /files/{id}': {
    schema: files.getFileByIdSchema,
    output: [
      http.Ok<outputs.GetFileById>,
      http.BadRequest<outputs.GetFileById400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof files.getFileByIdSchema>) {
      return toRequest(
        'GET /files/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof files.getFileByIdSchema>,
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
  'GET /files/{id}/signed-url': {
    schema: files.getSignedReadUrlSchema,
    output: [
      http.Ok<outputs.GetSignedReadUrl>,
      http.BadRequest<outputs.GetSignedReadUrl400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof files.getSignedReadUrlSchema>) {
      return toRequest(
        'GET /files/{id}/signed-url',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof files.getSignedReadUrlSchema>,
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
