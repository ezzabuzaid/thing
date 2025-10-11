import type * as models from '../index.ts';

export type GetFileById = {
  path: string;
  id: string;
  userId: string;
  name: string;
  updatedAt: string;
  size: number;
  contentType: string;
};

export type GetFileById400 = models.ValidationError;
