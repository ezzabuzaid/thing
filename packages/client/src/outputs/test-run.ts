import type * as models from '../index.ts';

export type TestRun = { result: string; title: string };

export type TestRun400 = models.ValidationError;
