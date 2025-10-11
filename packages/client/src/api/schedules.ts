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
import * as schedules from '../inputs/schedules.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /schedules': {
    schema: schedules.createScheduleSchema,
    output: [
      http.Created<outputs.CreateSchedule201>,
      http.BadRequest<outputs.CreateSchedule400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof schedules.createScheduleSchema>) {
      return toRequest(
        'POST /schedules',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'instructions', 'cron', 'enabled'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof schedules.createScheduleSchema>,
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
  'GET /schedules': {
    schema: schedules.listSchedulesSchema,
    output: [
      http.Ok<outputs.ListSchedules>,
      http.BadRequest<outputs.ListSchedules400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof schedules.listSchedulesSchema>) {
      return toRequest(
        'GET /schedules',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['page', 'pageSize'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof schedules.listSchedulesSchema>,
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
  'GET /schedules/{id}': {
    schema: schedules.getScheduleByIdSchema,
    output: [
      http.Ok<outputs.GetScheduleById>,
      http.BadRequest<outputs.GetScheduleById400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof schedules.getScheduleByIdSchema>) {
      return toRequest(
        'GET /schedules/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof schedules.getScheduleByIdSchema>,
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
