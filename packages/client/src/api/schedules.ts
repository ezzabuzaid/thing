import z from 'zod';
import * as http from '../http/response.ts';
import * as outputs from '../outputs/index.ts';
import { toRequest, json, urlencoded, empty, formdata, type HeadersInit } from '../http/request.ts';
import { chunked, buffered } from "../http/parse-response.ts";
import * as schedules from '../inputs/schedules.ts';
import { createBaseUrlInterceptor, createHeadersInterceptor, type Interceptor } from '../http/interceptors.ts';
import { Dispatcher, fetchType, type InstanceType } from '../http/dispatcher.ts';
import { Pagination, OffsetPagination, CursorPagination } from "../pagination/index.ts";
export default {
"POST /schedules": {
          schema: schedules.createScheduleSchema,
          output:[http.Created<outputs.CreateSchedule201>,http.BadRequest<outputs.CreateSchedule400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.createScheduleSchema>) {
           return toRequest('POST /schedules', json(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: ["title","instructions","cron","enabled","connectors"],
              inputParams: [],
            }));},
         async dispatch(input: z.input<typeof schedules.createScheduleSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"GET /schedules": {
          schema: schedules.listSchedulesSchema,
          output:[http.Ok<outputs.ListSchedules>,http.BadRequest<outputs.ListSchedules400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.listSchedulesSchema>) {
           return toRequest('GET /schedules', empty(input, {
              inputHeaders: [],
              inputQuery: ["page","pageSize"],
              inputBody: [],
              inputParams: [],
            }));},
         async dispatch(input: z.input<typeof schedules.listSchedulesSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"GET /schedules/{id}": {
          schema: schedules.getScheduleByIdSchema,
          output:[http.Ok<outputs.GetScheduleById>,http.BadRequest<outputs.GetScheduleById400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.getScheduleByIdSchema>) {
           return toRequest('GET /schedules/{id}', empty(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: [],
              inputParams: ["id"],
            }));},
         async dispatch(input: z.input<typeof schedules.getScheduleByIdSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"PATCH /schedules/{id}": {
          schema: schedules.updateScheduleSchema,
          output:[http.Ok<outputs.UpdateSchedule>,http.BadRequest<outputs.UpdateSchedule400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.updateScheduleSchema>) {
           return toRequest('PATCH /schedules/{id}', json(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: ["title","instructions","cron","connectors"],
              inputParams: ["id"],
            }));},
         async dispatch(input: z.input<typeof schedules.updateScheduleSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"DELETE /schedules/{id}": {
          schema: schedules.archiveScheduleSchema,
          output:[http.Ok<outputs.ArchiveSchedule>,http.BadRequest<outputs.ArchiveSchedule400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.archiveScheduleSchema>) {
           return toRequest('DELETE /schedules/{id}', empty(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: [],
              inputParams: ["id"],
            }));},
         async dispatch(input: z.input<typeof schedules.archiveScheduleSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"POST /schedules/{id}/pause": {
          schema: schedules.toggleScheduleSchema,
          output:[http.Ok<outputs.ToggleSchedule>,http.BadRequest<outputs.ToggleSchedule400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.toggleScheduleSchema>) {
           return toRequest('POST /schedules/{id}/pause', empty(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: [],
              inputParams: ["id"],
            }));},
         async dispatch(input: z.input<typeof schedules.toggleScheduleSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"POST /schedules/{id}/run": {
          schema: schedules.testRunSchema,
          output:[http.Ok<outputs.TestRun>,http.BadRequest<outputs.TestRun400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.testRunSchema>) {
           return toRequest('POST /schedules/{id}/run', json(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: ["source"],
              inputParams: ["id"],
            }));},
         async dispatch(input: z.input<typeof schedules.testRunSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          },
"POST /schedules/{id}/resume": {
          schema: schedules.resumeScheduleSchema,
          output:[http.Ok<outputs.ResumeSchedule>,http.BadRequest<outputs.ResumeSchedule400>,http.Unauthorized<outputs.UnauthorizedErr>],
          toRequest(input: z.input<typeof schedules.resumeScheduleSchema>) {
           return toRequest('POST /schedules/{id}/resume', empty(input, {
              inputHeaders: [],
              inputQuery: [],
              inputBody: [],
              inputParams: ["id"],
            }));},
         async dispatch(input: z.input<typeof schedules.resumeScheduleSchema>,options: {
            signal?: AbortSignal;
            interceptors: Interceptor[];
            fetch: z.infer<typeof fetchType>;
          }){
            const dispatcher = new Dispatcher(options.interceptors, options.fetch);
            const result = await dispatcher.send(this.toRequest(input), this.output);
            return result.data;
            },
          }
}