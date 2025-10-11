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
import * as timesheet from '../inputs/timesheet.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /timesheet/tree': {
    schema: timesheet.timesheetTreeSchema,
    output: [
      http.Ok<outputs.TimesheetTree>,
      http.BadRequest<outputs.TimesheetTree400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof timesheet.timesheetTreeSchema>) {
      return toRequest(
        'GET /timesheet/tree',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['since', 'until'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof timesheet.timesheetTreeSchema>,
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
