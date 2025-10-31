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
import * as cancel from '../inputs/cancel.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /reminders/{reminderId}/cancel': {
    schema: cancel.postRemindersreminderIdcancelSchema,
    output: [
      http.Ok<outputs.PostRemindersreminderIdcancel>,
      http.BadRequest<outputs.PostRemindersreminderIdcancel400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(
      input: z.input<typeof cancel.postRemindersreminderIdcancelSchema>,
    ) {
      return toRequest(
        'POST /reminders/{reminderId}/cancel',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['reminderId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof cancel.postRemindersreminderIdcancelSchema>,
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
