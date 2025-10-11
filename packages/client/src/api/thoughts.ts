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
import * as thoughts from '../inputs/thoughts.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /thoughts': {
    schema: thoughts.listThoughtsSchema,
    output: [
      http.Ok<outputs.ListThoughts>,
      http.BadRequest<outputs.ListThoughts400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof thoughts.listThoughtsSchema>) {
      return toRequest(
        'GET /thoughts',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['page', 'pageSize'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof thoughts.listThoughtsSchema>,
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
