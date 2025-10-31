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
import * as reminders from '../inputs/reminders.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /reminders': {
    schema: reminders.getRemindersSchema,
    output: [
      http.Ok<outputs.GetReminders>,
      http.BadRequest<outputs.GetReminders400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof reminders.getRemindersSchema>) {
      return toRequest(
        'GET /reminders',
        empty(input, {
          inputHeaders: [],
          inputQuery: [
            'from',
            'to',
            'includeCompleted',
            'includeCancelled',
            'limit',
          ],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof reminders.getRemindersSchema>,
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
  'POST /reminders': {
    schema: reminders.postRemindersSchema,
    output: [
      http.Created<outputs.PostReminders201>,
      http.BadRequest<outputs.PostReminders400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof reminders.postRemindersSchema>) {
      return toRequest(
        'POST /reminders',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'remindAt', 'notes', 'source'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof reminders.postRemindersSchema>,
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
  'PATCH /reminders/{reminderId}': {
    schema: reminders.patchRemindersreminderIdSchema,
    output: [
      http.Ok<outputs.PatchRemindersreminderId>,
      http.BadRequest<outputs.PatchRemindersreminderId400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof reminders.patchRemindersreminderIdSchema>) {
      return toRequest(
        'PATCH /reminders/{reminderId}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'notes'],
          inputParams: ['reminderId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof reminders.patchRemindersreminderIdSchema>,
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
