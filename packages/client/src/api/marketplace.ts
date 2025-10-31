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
import * as marketplace from '../inputs/marketplace.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /marketplace/templates': {
    schema: marketplace.listMarketplaceTemplatesSchema,
    output: [
      http.Ok<outputs.ListMarketplaceTemplates>,
      http.BadRequest<outputs.ListMarketplaceTemplates400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(
      input: z.input<typeof marketplace.listMarketplaceTemplatesSchema>,
    ) {
      return toRequest(
        'GET /marketplace/templates',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['creator', 'search', 'sort', 'page', 'pageSize'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof marketplace.listMarketplaceTemplatesSchema>,
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
  'GET /marketplace/templates/{id}': {
    schema: marketplace.getMarketplaceTemplateByIdSchema,
    output: [
      http.Ok<outputs.GetMarketplaceTemplateById>,
      http.BadRequest<outputs.GetMarketplaceTemplateById400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(
      input: z.input<typeof marketplace.getMarketplaceTemplateByIdSchema>,
    ) {
      return toRequest(
        'GET /marketplace/templates/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof marketplace.getMarketplaceTemplateByIdSchema>,
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
  'PATCH /marketplace/templates/{id}': {
    schema: marketplace.updateMarketplaceTemplateSchema,
    output: [
      http.Ok<outputs.UpdateMarketplaceTemplate>,
      http.BadRequest<outputs.UpdateMarketplaceTemplate400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(
      input: z.input<typeof marketplace.updateMarketplaceTemplateSchema>,
    ) {
      return toRequest(
        'PATCH /marketplace/templates/{id}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [
            'title',
            'description',
            'instructions',
            'suggestedCron',
            'connectors',
            'tags',
          ],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof marketplace.updateMarketplaceTemplateSchema>,
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
  'DELETE /marketplace/templates/{id}': {
    schema: marketplace.deleteMarketplaceTemplateSchema,
    output: [
      http.Ok<outputs.DeleteMarketplaceTemplate>,
      http.BadRequest<outputs.DeleteMarketplaceTemplate400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(
      input: z.input<typeof marketplace.deleteMarketplaceTemplateSchema>,
    ) {
      return toRequest(
        'DELETE /marketplace/templates/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof marketplace.deleteMarketplaceTemplateSchema>,
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
  'POST /schedules/{scheduleId}/publish-to-marketplace': {
    schema: marketplace.publishScheduleToMarketplaceSchema,
    output: [
      http.Created<outputs.PublishScheduleToMarketplace201>,
      http.BadRequest<outputs.PublishScheduleToMarketplace400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(
      input: z.input<typeof marketplace.publishScheduleToMarketplaceSchema>,
    ) {
      return toRequest(
        'POST /schedules/{scheduleId}/publish-to-marketplace',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [
            'description',
            'tags',
            'title',
            'instructions',
            'suggestedCron',
            'connectors',
          ],
          inputParams: ['scheduleId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof marketplace.publishScheduleToMarketplaceSchema>,
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
