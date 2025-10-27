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
import * as tasks from '../inputs/tasks.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /taskslists': {
    schema: tasks.tasksListSchema,
    output: [
      http.Ok<outputs.TasksList>,
      http.BadRequest<outputs.TasksList400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.tasksListSchema>) {
      return toRequest(
        'GET /taskslists',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.tasksListSchema>,
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
  'POST /taskslists': {
    schema: tasks.createTaskListSchema,
    output: [
      http.Created<outputs.CreateTaskList201>,
      http.BadRequest<outputs.CreateTaskList400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.createTaskListSchema>) {
      return toRequest(
        'POST /taskslists',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.createTaskListSchema>,
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
  'GET /taskslists/{taskListId}/tasks': {
    schema: tasks.getAllTasksInListSchema,
    output: [
      http.Ok<outputs.GetAllTasksInList>,
      http.BadRequest<outputs.GetAllTasksInList400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.getAllTasksInListSchema>) {
      return toRequest(
        'GET /taskslists/{taskListId}/tasks',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['taskListId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.getAllTasksInListSchema>,
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
  'POST /taskslists/{taskListId}/tasks': {
    schema: tasks.createTaskSchema,
    output: [
      http.Created<outputs.CreateTask201>,
      http.BadRequest<outputs.CreateTask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.createTaskSchema>) {
      return toRequest(
        'POST /taskslists/{taskListId}/tasks',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'notes', 'due'],
          inputParams: ['taskListId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.createTaskSchema>,
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
  'GET /tasks/tree': {
    schema: tasks.tasksTreeSchema,
    output: [
      http.Ok<outputs.TasksTree>,
      http.BadRequest<outputs.TasksTree400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.tasksTreeSchema>) {
      return toRequest(
        'GET /tasks/tree',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.tasksTreeSchema>,
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
  'POST /tasks/{taskId}/subtasks': {
    schema: tasks.createSubtaskSchema,
    output: [
      http.Created<outputs.CreateSubtask201>,
      http.BadRequest<outputs.CreateSubtask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.createSubtaskSchema>) {
      return toRequest(
        'POST /tasks/{taskId}/subtasks',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'notes', 'due'],
          inputParams: ['taskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.createSubtaskSchema>,
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
  'POST /tasks/{taskId}/complete': {
    schema: tasks.completeTaskSchema,
    output: [
      http.Ok<outputs.CompleteTask>,
      http.BadRequest<outputs.CompleteTask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.completeTaskSchema>) {
      return toRequest(
        'POST /tasks/{taskId}/complete',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['taskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.completeTaskSchema>,
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
  'POST /subtasks/{subtaskId}/complete': {
    schema: tasks.completeSubtaskSchema,
    output: [
      http.Ok<outputs.CompleteSubtask>,
      http.BadRequest<outputs.CompleteSubtask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.completeSubtaskSchema>) {
      return toRequest(
        'POST /subtasks/{subtaskId}/complete',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['subtaskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.completeSubtaskSchema>,
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
  'POST /tasks/{taskId}/uncomplete': {
    schema: tasks.uncompleteTaskSchema,
    output: [
      http.Ok<outputs.UncompleteTask>,
      http.BadRequest<outputs.UncompleteTask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.uncompleteTaskSchema>) {
      return toRequest(
        'POST /tasks/{taskId}/uncomplete',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['taskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.uncompleteTaskSchema>,
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
  'POST /subtasks/{subtaskId}/uncomplete': {
    schema: tasks.uncompleteSubtaskSchema,
    output: [
      http.Ok<outputs.UncompleteSubtask>,
      http.BadRequest<outputs.UncompleteSubtask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.uncompleteSubtaskSchema>) {
      return toRequest(
        'POST /subtasks/{subtaskId}/uncomplete',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['subtaskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.uncompleteSubtaskSchema>,
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
  'PATCH /tasks/{taskId}': {
    schema: tasks.updateTaskSchema,
    output: [
      http.Ok<outputs.UpdateTask>,
      http.BadRequest<outputs.UpdateTask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.updateTaskSchema>) {
      return toRequest(
        'PATCH /tasks/{taskId}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'notes'],
          inputParams: ['taskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.updateTaskSchema>,
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
  'PATCH /subtasks/{subtaskId}': {
    schema: tasks.updateSubtaskSchema,
    output: [
      http.Ok<outputs.UpdateSubtask>,
      http.BadRequest<outputs.UpdateSubtask400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.updateSubtaskSchema>) {
      return toRequest(
        'PATCH /subtasks/{subtaskId}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['title', 'notes'],
          inputParams: ['subtaskId'],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.updateSubtaskSchema>,
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
  'POST /tasks/sync': {
    schema: tasks.syncTasksSchema,
    output: [
      http.Ok<outputs.SyncTasks>,
      http.BadRequest<outputs.SyncTasks400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.input<typeof tasks.syncTasksSchema>) {
      return toRequest(
        'POST /tasks/sync',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.input<typeof tasks.syncTasksSchema>,
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
