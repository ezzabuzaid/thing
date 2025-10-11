import type * as models from '../index.ts';

export type UpdateChat = { id: string; userId: string; title: string };

export type UpdateChat400 = models.ValidationError;
